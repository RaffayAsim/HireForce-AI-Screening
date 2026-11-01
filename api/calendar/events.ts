import { getNangoKey } from "../_lib/nango.js";
import { verifyAuth } from "../_lib/auth.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Require auth token and derive userId server-side (FIX 1)
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid authentication token" });
  }

  const requestedUserId = req.query?.userId || (new URL(req.url, "http://localhost").searchParams.get("userId"));
  if (requestedUserId && requestedUserId !== "null" && requestedUserId !== "undefined" && requestedUserId.trim() !== "" && requestedUserId !== authUser.userId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Token does not match requested tenant" });
  }

  const effectiveUserId = authUser.userId;

  if (req.method === "GET") {
    try {
      const key = getNangoKey();
      if (!key) {
        return res.status(200).json({ success: true, events: [] });
      }

      const nangoResp = await fetch("https://api.nango.dev/connections", {
        headers: { "Authorization": `Bearer ${key}` }
      });
      const data = await nangoResp.json();
      const calConn = (data.connections || []).find((c: any) =>
        (c.provider_config_key === "google-calendar" || c.provider === "google-calendar") &&
        (c.end_user?.id === effectiveUserId || c.tags?.end_user_id === effectiveUserId || c.connection_id === effectiveUserId)
      );

      if (!calConn) {
        return res.status(200).json({ success: true, events: [] });
      }

      const detailResp = await fetch(`https://api.nango.dev/connection/${calConn.connection_id}?provider_config_key=google-calendar`, {
        headers: { "Authorization": `Bearer ${key}` }
      });
      const detailData = await detailResp.json();
      const accessToken = detailData?.credentials?.access_token || detailData?.credentials?.raw?.access_token;

      if (!accessToken) {
        return res.status(200).json({ success: true, events: [] });
      }

      const gCalResp = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=100&singleEvents=true&orderBy=startTime&timeMin=" +
        new Date(Date.now() - 30 * 86400000).toISOString(),
        { headers: { "Authorization": `Bearer ${accessToken}` } }
      );
      const gCalData = await gCalResp.json();
      const remoteItems = gCalData.items || [];
      const events: any[] = [];

      remoteItems.forEach((item: any) => {
        const isCandidateInterview =
          (item.summary && (item.summary.toLowerCase().includes("interview") || item.summary.toLowerCase().includes("screening") || item.summary.toLowerCase().includes("technical round"))) ||
          (item.description && (item.description.includes("HireForce") || item.description.includes("Candidate:") || item.description.includes("Format:")));

        if (!isCandidateInterview) return;

        let dateStr = item.start?.date || "";
        let timeStr = "10:00";
        if (item.start?.dateTime) {
          const parts = item.start.dateTime.split("T");
          dateStr = parts[0];
          if (parts[1]) timeStr = parts[1].substring(0, 5);
        }

        const desc = item.description || "";
        const parsedCandidate = desc.match(/Candidate:\s*([^\n\r]+)/)?.[1]?.trim() || item.summary?.replace(/^(?:Phone|Physical)?\s*Interview:\s*/i, "").trim();
        const parsedEmail = desc.match(/Email:\s*([^\n\r]+)/)?.[1]?.trim() || item.attendees?.[0]?.email || "";
        const parsedRole = desc.match(/(?:Role|Job Title):\s*([^\n\r]+)/)?.[1]?.trim() || "Evaluated Position";
        const parsedPhone = desc.match(/Phone:\s*([^\n\r]+)/)?.[1]?.trim() || "";

        let format: "phone" | "teams" | "google_meet" | "in_person" = "google_meet";
        if (desc.includes("Format: phone") || item.summary?.toLowerCase().includes("phone interview") || parsedPhone) {
          format = "phone";
        } else if (desc.includes("Format: teams") || item.summary?.toLowerCase().includes("teams")) {
          format = "teams";
        } else if (desc.includes("Format: physical") || desc.includes("Format: in_person")) {
          format = "in_person";
        }

        events.push({
          id: item.id,
          candidate_id: item.id,
          candidate_name: parsedCandidate,
          candidate_email: parsedEmail,
          job_id: "job-general",
          job_title: parsedRole,
          round_type: "Technical Round",
          meeting_format: format,
          meeting_link: item.hangoutLink || "",
          phone_number: parsedPhone,
          location: item.location || "",
          date: dateStr,
          time: timeStr,
          duration_minutes: 45,
          interviewer: "Talent Acquisition Team",
          status: "Scheduled",
          user_id: effectiveUserId,
        });
      });

      return res.status(200).json({ success: true, events });
    } catch (err: any) {
      return res.status(200).json({ success: false, events: [], error: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const data = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const {
        id = `int-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        candidate_id,
        candidate_name = data.summary?.replace(/^(?:Phone|Physical)?\s*Interview:\s*/i, "") || "Candidate",
        candidate_email,
        job_id,
        job_title = "Evaluated Position",
        round_type = "Technical Round",
        meeting_format = (data.description?.includes("Format: phone") || data.format === "phone" || data.meeting_format === "phone") ? "phone" : (data.format || data.meeting_format || "google_meet"),
        meeting_link,
        phone_number = data.phone || data.schedulePhone || data.phone_number,
        location = data.location || data.scheduleLocation,
        date,
        time = "10:00",
        duration_minutes = 45,
        interviewer = "Talent Acquisition Team",
        notes = data.description || data.notes || "",
        status = "Scheduled",
        userId = effectiveUserId,
      } = data;

      const createdEventObj: any = {
        id,
        candidate_id,
        candidate_name,
        candidate_email,
        job_id,
        job_title,
        round_type,
        meeting_format,
        meeting_link: meeting_format === "phone" ? (phone_number ? `tel:${phone_number}` : "") : meeting_link,
        phone_number,
        location,
        date,
        time,
        duration_minutes,
        interviewer,
        notes,
        status,
        user_id: userId,
      };

      // Call Google Calendar API using Nango connection
      const key = getNangoKey();
      if (key) {
        try {
          const nangoResp = await fetch("https://api.nango.dev/connections", {
            headers: { "Authorization": `Bearer ${key}` }
          });
          const nangoData = await nangoResp.json();
          let calConnections = nangoData.connections || [];
          if (userId && userId !== "null" && userId !== "undefined") {
            calConnections = calConnections.filter((c: any) =>
              c.end_user?.id === userId ||
              c.tags?.end_user_id === userId ||
              c.connection_id === userId
            );
          } else {
            calConnections = [];
          }
          const calConn = calConnections.find((c: any) =>
            c.provider_config_key === "google-calendar" || c.provider === "google-calendar"
          );

          if (calConn) {
            const detailResp = await fetch(`https://api.nango.dev/connection/${calConn.connection_id}?provider_config_key=google-calendar`, {
              headers: { "Authorization": `Bearer ${key}` }
            });
            const detailData = await detailResp.json();
            const accessToken = detailData?.credentials?.access_token || detailData?.credentials?.raw?.access_token;

            if (accessToken) {
              let gCalTimeZone = "UTC";
              try {
                const calMetaResp = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary", {
                  headers: { "Authorization": `Bearer ${accessToken}` }
                });
                const calMeta = await calMetaResp.json();
                if (calMeta?.timeZone) gCalTimeZone = calMeta.timeZone;
              } catch { }

              const [h, m] = (time || "10:00").split(":").map(Number);
              const dur = duration_minutes || 45;
              const totalM = (h || 10) * 60 + (m || 0) + dur;
              const endH = Math.floor(totalM / 60) % 24;
              const endM = totalM % 60;
              const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

              const summaryTitle = meeting_format === "phone"
                ? `Phone Interview: ${candidate_name} (${job_title})`
                : meeting_format === "in_person"
                  ? `Physical Interview: ${candidate_name} (${job_title})`
                  : `Interview: ${candidate_name} (${job_title})`;

              const formatDisplayName = 
                meeting_format === "google_meet" ? "Google Meet (Video Call)" :
                meeting_format === "teams" ? "Microsoft Teams" :
                meeting_format === "phone" ? "Phone Call" :
                meeting_format === "in_person" || meeting_format === "physical" ? "In-Person (Office)" :
                meeting_format;

              const gCalPayload: any = {
                summary: summaryTitle,
                description: [
                  `Candidate: ${candidate_name}`,
                  candidate_email ? `Email: ${candidate_email}` : "",
                  `Role: ${job_title}`,
                  `Format: ${formatDisplayName}`,
                  phone_number ? `Phone: ${phone_number}` : "",
                  `Round: ${round_type}`,
                  notes ? `Notes: ${notes}` : "",
                  `-- Scheduled via HireForce AI Screening --`
                ].filter(Boolean).join("\n"),
                location: meeting_format === "phone"
                  ? (phone_number ? `Phone: ${phone_number}` : "Phone Call")
                  : (location || ""),
                start: { dateTime: `${date}T${time}:00`, timeZone: gCalTimeZone },
                end: { dateTime: `${date}T${endTimeStr}:00`, timeZone: gCalTimeZone },
                reminders: { useDefault: true },
              };

              if (candidate_email) {
                gCalPayload.attendees = [
                  { email: candidate_email, displayName: candidate_name || "Candidate" }
                ];
              }

              if (meeting_format === "google_meet") {
                gCalPayload.conferenceData = {
                  createRequest: {
                    requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    conferenceSolutionKey: { type: "hangoutsMeet" }
                  }
                };
              }

              const gResp = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(gCalPayload)
              });

              if (gResp.ok) {
                const gData = await gResp.json();
                createdEventObj.id = createdEventObj.id || gData.id;
                createdEventObj.google_event_id = gData.id;
                if (gData.hangoutLink && meeting_format === "google_meet") {
                  createdEventObj.meeting_link = gData.hangoutLink;
                }
              } else {
                const errBody = await gResp.text();
                console.warn("Google Calendar insert error:", errBody);
              }
            }
          }
        } catch (gErr) {
          console.warn("Sync to Google Calendar failed:", gErr);
        }
      }

      if (meeting_format === "google_meet" && (!createdEventObj.meeting_link || !createdEventObj.meeting_link.includes("meet.google.com"))) {
        return res.status(400).json({
          success: false,
          error: "Google Calendar is not connected or failed to generate a Google Meet link. Please connect Google Calendar in Settings."
        });
      }

      return res.status(200).json({ success: true, event: createdEventObj });
    } catch (err: any) {
      return res.status(200).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: "Method Not Allowed" });
}
