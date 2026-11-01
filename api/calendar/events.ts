import { getNangoKey } from "../_lib/nango.js";
import { verifyAuth } from "../_lib/auth.js";
import { getIntegration } from "../_lib/integrations.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Require auth token and derive tenantId server-side
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.tenantId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid authentication token" });
  }

  const effectiveTenantId = authUser.tenantId;

  if (req.method === "GET") {
    try {
      const calInt = await getIntegration(effectiveTenantId, "google", "calendar");
      if (!calInt) {
        return res.status(200).json({ success: true, events: [] });
      }

      const key = getNangoKey();
      if (!key) {
        return res.status(200).json({ success: true, events: [] });
      }

      const detailResp = await fetch(`https://api.nango.dev/connection/${calInt.connection_id}?provider_config_key=google-calendar`, {
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
        const parsedCandidateId = desc.match(/CandidateId:\s*([^\n\r]+)/)?.[1]?.trim() || item.id;
        const parsedEmail = desc.match(/Email:\s*([^\n\r]+)/)?.[1]?.trim() || item.attendees?.[0]?.email || "";
        const parsedRole = desc.match(/(?:Role|Job Title):\s*([^\n\r]+)/)?.[1]?.trim() || "Evaluated Position";
        const parsedPhone = desc.match(/Phone:\s*([^\n\r]+)/)?.[1]?.trim() || "";
        const parsedInterviewer = desc.match(/Interviewer:\s*([^\n\r]+)/)?.[1]?.trim() || "Talent Acquisition Team";

        let format: "phone" | "teams" | "google_meet" | "in_person" = "google_meet";
        if (item.hangoutLink || desc.includes("Format: Google Meet") || desc.includes("meet.google.com")) {
          format = "google_meet";
        } else if (desc.includes("Format: teams") || desc.includes("teams.microsoft.com") || item.summary?.toLowerCase().includes("teams")) {
          format = "teams";
        } else if (desc.includes("Format: phone") || item.summary?.toLowerCase().includes("phone interview")) {
          format = "phone";
        } else if (desc.includes("Format: physical") || desc.includes("Format: in_person")) {
          format = "in_person";
        }

        events.push({
          id: item.id,
          candidate_id: parsedCandidateId,
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
          interviewer: parsedInterviewer,
          status: "Scheduled",
          user_id: effectiveTenantId,
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
        phone_number = data.phone || data.schedulePhone || data.phone_number,
        location = data.location || data.scheduleLocation,
        date,
        time = "10:00",
        duration_minutes = 45,
        interviewer = "Talent Acquisition Team",
        notes = data.description || data.notes || "",
        status = "Scheduled",
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
        meeting_link: "",
        phone_number,
        location,
        date,
        time,
        duration_minutes,
        interviewer,
        notes,
        status,
        user_id: effectiveTenantId,
      };

      if (meeting_format === "google_meet") {
        const calInt = await getIntegration(effectiveTenantId, "google", "meeting") || await getIntegration(effectiveTenantId, "google", "calendar");
        if (!calInt) {
          return res.status(400).json({
            success: false,
            error: "Google Calendar is not connected or failed to generate a Google Meet link. Please connect Google Calendar in Settings."
          });
        }

        const key = getNangoKey();
        if (key) {
          try {
            const detailResp = await fetch(`https://api.nango.dev/connection/${calInt.connection_id}?provider_config_key=google-calendar`, {
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

              const summaryTitle = `Interview: ${candidate_name} (${job_title})`;
              const formatDisplayName = "Google Meet (Video Call)";

              const gCalPayload: any = {
                summary: summaryTitle,
                description: [
                  `Candidate: ${candidate_name}`,
                  candidate_id ? `CandidateId: ${candidate_id}` : "",
                  candidate_email ? `Email: ${candidate_email}` : "",
                  `Role: ${job_title}`,
                  `Format: ${formatDisplayName}`,
                  interviewer ? `Interviewer: ${interviewer}` : "",
                  phone_number ? `Phone: ${phone_number}` : "",
                  `Round: ${round_type}`,
                  notes ? `Notes: ${notes}` : "",
                  `-- Scheduled via HireForce AI Screening --`
                ].filter(Boolean).join("\n"),
                location: location || "",
                start: { dateTime: `${date}T${time}:00`, timeZone: gCalTimeZone },
                end: { dateTime: `${date}T${endTimeStr}:00`, timeZone: gCalTimeZone },
                reminders: { useDefault: true },
              };

              if (candidate_email) {
                gCalPayload.attendees = [
                  { email: candidate_email, displayName: candidate_name || "Candidate" }
                ];
              }

              gCalPayload.conferenceData = {
                createRequest: {
                  requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  conferenceSolutionKey: { type: "hangoutsMeet" }
                }
              };

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
                createdEventObj.id = gData.id;
                createdEventObj.google_event_id = gData.id;
                if (gData.hangoutLink) {
                  createdEventObj.meeting_link = gData.hangoutLink;
                }
              }
            }
          } catch (gErr) {
            console.warn("Sync to Google Calendar failed:", gErr);
          }
        }

        if (!createdEventObj.meeting_link || !createdEventObj.meeting_link.includes("meet.google.com")) {
          return res.status(400).json({
            success: false,
            error: "Google Calendar is not connected or failed to generate a Google Meet link. Please connect Google Calendar in Settings."
          });
        }
      } else if (meeting_format === "teams") {
        const msInt = await getIntegration(effectiveTenantId, "microsoft", "meeting") || await getIntegration(effectiveTenantId, "microsoft", "calendar");
        if (!msInt) {
          return res.status(400).json({
            success: false,
            error: "Microsoft Teams is not connected. Please connect Microsoft Teams in Settings to create a meeting link."
          });
        }

        const key = getNangoKey();
        if (key) {
          try {
            const detailResp = await fetch(`https://api.nango.dev/connection/${msInt.connection_id}?provider_config_key=microsoft-teams`, {
              headers: { "Authorization": `Bearer ${key}` }
            });
            const detailData = await detailResp.json();
            const accessToken = detailData?.credentials?.access_token || detailData?.credentials?.raw?.access_token;
            if (accessToken) {
              const [h, m] = (time || "10:00").split(":").map(Number);
              const dur = duration_minutes || 45;
              const totalM = (h || 10) * 60 + (m || 0) + dur;
              const endH = Math.floor(totalM / 60) % 24;
              const endM = totalM % 60;
              const endTimeStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

              const msResp = await fetch("https://graph.microsoft.com/v1.0/me/onlineMeetings", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  startDateTime: `${date}T${time}:00Z`,
                  endDateTime: `${date}T${endTimeStr}:00Z`,
                  subject: `Interview: ${candidate_name} (${job_title})`
                })
              });

              if (msResp.ok) {
                const msData = await msResp.json();
                const teamsLink = msData.joinWebUrl || msData.joinUrl;
                if (teamsLink && teamsLink.includes("teams.microsoft.com")) {
                  createdEventObj.meeting_link = teamsLink;
                  createdEventObj.ms_event_id = msData.id;
                }
              }
            }
          } catch (msErr) {
            console.warn("Sync to Microsoft Teams failed:", msErr);
          }
        }

        if (!createdEventObj.meeting_link || !createdEventObj.meeting_link.includes("teams.microsoft.com")) {
          return res.status(400).json({
            success: false,
            error: "Microsoft Teams is not connected or failed to generate a meeting link. Please connect Microsoft Teams in Settings."
          });
        }
      } else if (meeting_format === "zoho" || meeting_format === "zoho_meeting") {
        const zohoInt = await getIntegration(effectiveTenantId, "zoho", "meeting");
        if (!zohoInt) {
          return res.status(400).json({
            success: false,
            error: "Zoho Meeting is not connected. Please connect Zoho in Settings to create a meeting link."
          });
        }

        const key = getNangoKey();
        if (key) {
          try {
            const detailResp = await fetch(`https://api.nango.dev/connection/${zohoInt.connection_id}?provider_config_key=zoho-meeting`, {
              headers: { "Authorization": `Bearer ${key}` }
            });
            const detailData = await detailResp.json();
            const accessToken = detailData?.credentials?.access_token || detailData?.credentials?.raw?.access_token;
            if (accessToken) {
              const zohoResp = await fetch("https://meeting.zoho.com/api/v2/sessions.json", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  session: {
                    topic: `Interview: ${candidate_name} (${job_title})`,
                    presenter: candidate_email || "recruiter",
                    duration: duration_minutes || 45
                  }
                })
              });
              if (zohoResp.ok) {
                const zData = await zohoResp.json();
                const link = zData?.session?.join_url || zData?.join_url;
                if (link && (link.includes("meeting.zoho.com") || link.includes("meet.zoho.com"))) {
                  createdEventObj.meeting_link = link;
                }
              }
            }
          } catch (zErr) {
            console.warn("Sync to Zoho Meeting failed:", zErr);
          }
        }

        if (!createdEventObj.meeting_link || (!createdEventObj.meeting_link.includes("meeting.zoho.com") && !createdEventObj.meeting_link.includes("meet.zoho.com"))) {
          return res.status(400).json({
            success: false,
            error: "Zoho Meeting is not connected or failed to generate a meeting link. Please connect Zoho in Settings."
          });
        }
      } else if (meeting_format === "phone") {
        createdEventObj.meeting_link = phone_number ? `tel:${phone_number}` : "";
      } else if (meeting_format === "in_person" || meeting_format === "physical") {
        createdEventObj.meeting_link = "";
      } else {
        return res.status(400).json({
          success: false,
          error: "Invalid or unsupported meeting format requested."
        });
      }

      return res.status(200).json({ success: true, event: createdEventObj });
    } catch (err: any) {
      return res.status(200).json({ success: false, error: err.message });
    }
  }

  if (req.method === "PATCH") {
    try {
      const data = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const { id, status = "Cancelled", google_event_id } = data;
      const targetGId = google_event_id || id;
      if (!id && !targetGId) {
        return res.status(400).json({ success: false, error: "Interview ID is required" });
      }

      // If connected to Google Calendar, cancel/delete provider event so guests get cancellation notice
      const calInt = await getIntegration(effectiveTenantId, "google", "calendar");
      if (calInt && status === "Cancelled" && targetGId) {
        const key = getNangoKey();
        if (key) {
          try {
            const detailResp = await fetch(`https://api.nango.dev/connection/${calInt.connection_id}?provider_config_key=google-calendar`, {
              headers: { "Authorization": `Bearer ${key}` }
            });
            const detailData = await detailResp.json();
            const accessToken = detailData?.credentials?.access_token || detailData?.credentials?.raw?.access_token;
            if (accessToken) {
              await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(targetGId)}?sendUpdates=all`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${accessToken}` }
              }).catch(() => {});
            }
          } catch {}
        }
      }

      return res.status(200).json({
        success: true,
        event: { id, status, google_event_id: null },
        message: "Interview session status updated successfully"
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Failed to update interview" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const data = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const id = req.query?.id || data?.id;
      const google_event_id = req.query?.google_event_id || data?.google_event_id;
      const targetGId = google_event_id || id;
      if (!id && !targetGId) {
        return res.status(400).json({ success: false, error: "Interview ID is required" });
      }

      // If connected to Google Calendar, delete remote event
      const calInt = await getIntegration(effectiveTenantId, "google", "calendar");
      if (calInt && targetGId) {
        const key = getNangoKey();
        if (key) {
          try {
            const detailResp = await fetch(`https://api.nango.dev/connection/${calInt.connection_id}?provider_config_key=google-calendar`, {
              headers: { "Authorization": `Bearer ${key}` }
            });
            const detailData = await detailResp.json();
            const accessToken = detailData?.credentials?.access_token || detailData?.credentials?.raw?.access_token;
            if (accessToken) {
              await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(targetGId)}?sendUpdates=all`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${accessToken}` }
              }).catch(() => {});
            }
          } catch {}
        }
      }

      return res.status(200).json({
        success: true,
        id,
        message: "Interview session deleted successfully"
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Failed to delete interview" });
    }
  }

  return res.status(405).json({ success: false, error: "Method Not Allowed" });
}
