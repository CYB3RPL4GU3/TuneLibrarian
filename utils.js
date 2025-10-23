import 'dotenv/config';

export async function TuneWebHookRequest(options) {
  // append endpoint to root API URL
  const url = process.env.TUNE_WEBHOOK_URL;
  // Use fetch to make requests
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'text/plain; charset=UTF-8',
      'User-Agent': 'TuneLibrarian (1.0.0)',
      'Connection': 'keep-alive',
      'Accept': 'application/json',
    },
    ...options
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function fetchTunes(stream, filter) {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  var content = '';

  var {value: chunk, done: readerDone} = await reader.read();
  while (!readerDone) {
    content += decoder.decode(chunk, {stream: true});
    ({value: chunk, done: readerDone} = await reader.read());
  }

  const jsonTunes = JSON.parse(content);
  var messages = [`No tunes found for filter: ${filter}.`];
  var i = 1;
  var charCount = 0;
        
  if (jsonTunes && jsonTunes.length > 0) {
    messages[0] = `${jsonTunes.length} tune(s) found for filter: ${filter}.\n`;
    for (const tune of jsonTunes) {
      messages[i] = messages[i] || '';
      var tuneContent = `- ${tune.year} ${tune.make} ${tune.model} (${tune.class} ${tune.pi}, ${tune.drivetrain}, ${tune.bestfor.map(item => capitalize(item)).join(' / ') }${tune.antilag === 'Yes' ? ', with anti-lag' : ''}${tune.comments !== '' ? ', ' + tune.comments : ''}): ${tune.sharecode}\n`;
      charCount += tuneContent.length;
      if (charCount >= 1900) { // Discord message limit is 2000 characters
        i++;
        messages[i] = messages[i] || '';
        charCount = tuneContent.length;
      }
      messages[i] += tuneContent;
    }
  }

  return messages;
}

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
    },
    ...options
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
