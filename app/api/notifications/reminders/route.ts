import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  sendNotificationToUser,
  formatTaskReminderMessage,
  formatEventReminderMessage,
} from "@/lib/services/notifications";
import { addDays, format } from "date-fns";

// This endpoint should be called by a cron job (e.g., Vercel Cron or external service)
// It checks for events and tasks due tomorrow and sends reminders
export async function GET(request: Request) {
  try {
    // Optional: Add API key authentication for cron jobs
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get app-level settings
    const { data: appSettings } = await supabase
      .from("app_settings")
      .select("id, notifications_enabled, enable_sms, enable_whatsapp")
      .limit(1)
      .single();

    // Check app-level notifications first
    if (appSettings && !appSettings.notifications_enabled) {
      return NextResponse.json({
        success: true,
        message: "Notifications are disabled at application level",
        date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        eventsFound: 0,
        tasksFound: 0,
        notificationsSent: { events: 0, tasks: 0 },
        results: { events: [], tasks: [] },
      });
    }

    // Get tomorrow's date
    const tomorrow = addDays(new Date(), 1);
    const tomorrowDateStr = format(tomorrow, "yyyy-MM-dd");

    // Get all family members with phone numbers and notification preferences
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, phone_number, notifications_enabled, whatsapp_enabled, sms_enabled")
      .not("phone_number", "is", null);

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        message: "No family members with phone numbers found",
        events: [],
        tasks: [],
      });
    }

    // Deduplicate profiles by phone number to avoid sending duplicate notifications
    // If multiple profiles have the same phone number, only send to the first one
    const uniqueProfilesByPhone = new Map<string, typeof profiles[0]>();
    for (const profile of profiles) {
      if (profile.phone_number && !uniqueProfilesByPhone.has(profile.phone_number)) {
        uniqueProfilesByPhone.set(profile.phone_number, profile);
      }
    }
    const deduplicatedProfiles = Array.from(uniqueProfilesByPhone.values());

    // Get events due tomorrow
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, title, date, time, created_by, profiles!events_created_by_fkey(name)")
      .eq("date", tomorrowDateStr);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
    }

    // Get tasks due tomorrow (not completed)
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, due_date, created_by, profiles!tasks_created_by_fkey(name)")
      .eq("due_date", tomorrowDateStr)
      .eq("completed", false);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
    }

    const results = {
      events: [] as any[],
      tasks: [] as any[],
    };

    let rateLimitDetected = false;

    // Send event reminders
    if (events && events.length > 0) {
      for (const event of events) {
        const creatorName = (event.profiles as any)?.name || null;
        const message = formatEventReminderMessage(
          event.title,
          format(new Date(event.date), "MMMM d, yyyy"),
          event.time || null,
          creatorName
        );

        // Send to all family members (deduplicated by phone number)
        for (const profile of deduplicatedProfiles) {
          if (
            profile.phone_number &&
            profile.notifications_enabled !== false
          ) {
            const result = await sendNotificationToUser(
              profile.phone_number,
              profile.notifications_enabled ?? true,
              profile.whatsapp_enabled ?? true,
              profile.sms_enabled ?? true,
              message,
              appSettings || null
            );
            
            // Track if rate limit was detected
            if (result.rateLimited) {
              rateLimitDetected = true;
            }
            
            results.events.push({
              eventId: event.id,
              eventTitle: event.title,
              profileId: profile.id,
              profileName: profile.name,
              whatsapp: result.whatsapp,
              sms: result.sms,
              errors: result.errors,
            });
          }
        }
      }
    }

    // Send task reminders
    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        const creatorName = (task.profiles as any)?.name || null;
        const message = formatTaskReminderMessage(
          task.title,
          format(new Date(task.due_date), "MMMM d, yyyy"),
          creatorName
        );

        // Send to all family members (deduplicated by phone number)
        for (const profile of deduplicatedProfiles) {
          if (
            profile.phone_number &&
            profile.notifications_enabled !== false
          ) {
            const result = await sendNotificationToUser(
              profile.phone_number,
              profile.notifications_enabled ?? true,
              profile.whatsapp_enabled ?? true,
              profile.sms_enabled ?? true,
              message,
              appSettings || null
            );
            results.tasks.push({
              taskId: task.id,
              taskTitle: task.title,
              profileId: profile.id,
              profileName: profile.name,
              whatsapp: result.whatsapp,
              sms: result.sms,
              errors: result.errors,
            });
          }
        }
      }
    }

    // Auto-disable notifications if rate limit was detected
    if (rateLimitDetected && appSettings) {
      await supabase
        .from("app_settings")
        .update({ notifications_enabled: false })
        .eq("id", appSettings.id);
    }

    const response: any = {
      success: true,
      date: tomorrowDateStr,
      eventsFound: events?.length || 0,
      tasksFound: tasks?.length || 0,
      notificationsSent: {
        events: results.events.filter((r) => r.whatsapp || r.sms).length,
        tasks: results.tasks.filter((r) => r.whatsapp || r.sms).length,
      },
      results,
    };

    if (rateLimitDetected) {
      response.rateLimitExceeded = true;
      response.message = "Twilio daily message limit exceeded. Notifications have been automatically disabled. They will need to be manually re-enabled after the limit resets (typically at midnight).";
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Reminder cron error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process reminders" },
      { status: 500 }
    );
  }
}

