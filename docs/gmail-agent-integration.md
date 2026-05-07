# Gmail Agent Integration (Apps Script -> TaskBridge)

This flow lets Google Apps Script ingest email-derived suggestions into TaskBridge without giving TaskBridge direct mailbox access.

## Quick smoke test (UI first)

Before wiring Apps Script, validate your TaskBridge flow directly in UI:

1. Sign in and open dashboard.
2. In `Agent integration`, click `Generate token` (optional for this smoke test).
3. Click `Test ingest` to create a sample pending suggestion.
4. Open `Task suggestions` -> `Review & approve`.
5. Choose workspace/assignee/priority and approve.
6. Verify task appears in `Tasks` list.

## 1) Generate token in TaskBridge

1. Sign in to TaskBridge dashboard.
2. Open `Agent integration` panel.
3. Click `Generate token`.
4. Copy the plaintext token immediately (it is shown once).

## 2) Configure Apps Script properties

Set these script properties:

- `TASKBRIDGE_INGEST_URL`: `https://<api-domain>/v1/integrations/gmail-agent/ingest`
- `TASKBRIDGE_INGEST_TOKEN`: token created in step 1
- `GEMINI_API_KEY`: your AI Studio key
- `GMAIL_QUERY` (optional): default is `is:unread newer_than:2d`

## 3) Apps Script template (copy/paste)

Create a project in <https://script.google.com/> and replace `Code.gs` with:

```javascript
const MAX_THREADS_PER_RUN = 5;
const MAX_BODY_CHARS = 2000;

function runGmailAgent() {
  const props = PropertiesService.getScriptProperties();
  const receiverUrl = mustGetProp(props, 'TASKBRIDGE_INGEST_URL');
  const ingestToken = mustGetProp(props, 'TASKBRIDGE_INGEST_TOKEN');
  const geminiApiKey = mustGetProp(props, 'GEMINI_API_KEY');
  const gmailQuery = props.getProperty('GMAIL_QUERY') || 'is:unread newer_than:2d';

  const threads = GmailApp.search(gmailQuery, 0, MAX_THREADS_PER_RUN);
  for (const thread of threads) {
    const message = thread.getMessages().slice(-1)[0];
    const email = toEmailPayload(message);
    const suggestion = extractSuggestionWithGemini(email, geminiApiKey);

    if (!suggestion.isTask) continue;

    const ingestPayload = {
      title: (suggestion.title || '').trim(),
      description: (suggestion.description || '').trim() || undefined,
      source: {
        messageId: email.messageId,
        threadId: email.threadId,
        from: email.from,
        subject: email.subject,
        bodyPreview: email.bodyPreview,
        receivedAt: email.receivedAt,
      },
    };

    if (!ingestPayload.title) continue;

    const accepted = sendToTaskBridge(receiverUrl, ingestToken, ingestPayload);
    if (accepted) thread.markRead();
  }
}

function toEmailPayload(message) {
  return {
    messageId: message.getId(),
    threadId: message.getThread().getId(),
    from: message.getFrom(),
    subject: message.getSubject(),
    bodyPreview: message.getPlainBody().slice(0, MAX_BODY_CHARS),
    receivedAt: message.getDate().toISOString(),
  };
}

function extractSuggestionWithGemini(email, apiKey) {
  const prompt = [
    'You classify if an email contains an actionable task for the recipient.',
    'Return strict JSON only (no markdown fences) with schema:',
    '{"isTask":boolean,"title":string,"description":string}',
    'If no actionable task, return {"isTask":false,"title":"","description":""}.',
    '',
    'Email:',
    `From: ${email.from}`,
    `Subject: ${email.subject}`,
    `Body: ${email.bodyPreview}`,
  ].join('\n');

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
    encodeURIComponent(apiKey);

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Gemini call failed: ' + response.getContentText());
  }

  const raw = JSON.parse(response.getContentText());
  const text =
    raw &&
    raw.candidates &&
    raw.candidates[0] &&
    raw.candidates[0].content &&
    raw.candidates[0].content.parts &&
    raw.candidates[0].content.parts[0] &&
    raw.candidates[0].content.parts[0].text;

  if (!text) return { isTask: false, title: '', description: '' };

  try {
    const parsed = JSON.parse(String(text).replace(/```json|```/g, '').trim());
    return {
      isTask: !!parsed.isTask,
      title: typeof parsed.title === 'string' ? parsed.title : '',
      description: typeof parsed.description === 'string' ? parsed.description : '',
    };
  } catch (_err) {
    return { isTask: false, title: '', description: '' };
  }
}

function sendToTaskBridge(url, token, payload) {
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();
  if (status >= 200 && status < 300) return true;
  throw new Error('TaskBridge ingest failed: ' + response.getContentText());
}

function mustGetProp(props, key) {
  const value = props.getProperty(key);
  if (!value) throw new Error('Missing script property: ' + key);
  return value;
}
```

## 4) Configure and run the script

1. In Apps Script, open `Project Settings` -> `Script properties`.
2. Add all properties listed in section 2.
3. Save and run `runGmailAgent` once manually to grant permissions.
4. Confirm a pending suggestion appears in TaskBridge dashboard.

## 5) Automate with a trigger

1. Open Apps Script `Triggers` (clock icon).
2. Add trigger for `runGmailAgent`.
3. Choose `Time-driven` and run every 10 or 15 minutes.

## 6) Local API testing with curl

Use curl to validate ingest before wiring Gmail:

```bash
curl -X POST "http://localhost:4000/v1/integrations/gmail-agent/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_AGENT_TOKEN>" \
  -d '{
    "title":"Draft proposal for Q3 planning",
    "description":"Follow-up requested in email",
    "source":{
      "messageId":"manual-test-1",
      "threadId":"manual-thread-1",
      "from":"lead@example.com",
      "subject":"Q3 planning",
      "bodyPreview":"Please draft this by Friday",
      "receivedAt":"2026-05-07T13:00:00.000Z"
    }
  }'
```

Then open dashboard -> `Task suggestions` -> `Review & approve`.

## 7) Notes

- Duplicate suggestions are deduped using message id (or fallback hash).
- Revoked tokens stop ingest immediately.
- Token owner must be signed in to review/approve suggestions.
- Apps Script quotas apply; keep `MAX_THREADS_PER_RUN` small.
