import 'dotenv/config';
import express from 'express';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { TuneWebHookRequest, fetchTunes, DiscordRequest } from './utils.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name, options } = data;
    const endpoint = `interactions/${id}/${req.body.token}/callback?with_response=true`;
    const editEndpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original?with_components=true`;
    const newMsgEndpoint = `webhooks/${process.env.APP_ID}/${req.body.token}?with_components=true`;

    // "tune" command
    if (name === 'tune') {
      try {
        // Defer the response to give us more time to fetch tunes
        await res.status(202).send();
        // Send a message into the channel where command was triggered from
        const callback = await DiscordRequest(endpoint, {
          method: 'POST', body: {
            type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              content: 'Fetching tunes...',
            },
          }
        });
        
        //Get tunes and concatenate them into readable format
        const filter = options[0].value;
        const webHookResponse = await TuneWebHookRequest({ method: process.env.TUNE_WEBHOOK_METHOD, body: filter });
        const tuneMessages = await fetchTunes(webHookResponse.body, filter);
        
        await DiscordRequest(editEndpoint, {
          method: 'PATCH', body: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: tuneMessages[0],
              }
            ]
          }
        });

        for (var i = 1; i < tuneMessages.length; i++) {
          await DiscordRequest(newMsgEndpoint, {
          method: 'POST', body: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: tuneMessages[i],
              }
            ]
          }
        });
        }

        return;
      } catch (err) {
        console.error('Error:', err);

        await DiscordRequest(editEndpoint, {
          method: 'PATCH', body: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: 'An error occurred while fetching tunes. Please try again later.',
              }
            ]
          },
        });

        return;
      }
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
  console.log('Listening on port', PORT);
});
