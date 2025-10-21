import 'dotenv/config';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Tune command
const TUNE_COMMAND = {
  name: 'tune',
  description: 'Filter tunes by various criteria',
  type: 1,
  options: [
    {
      "name": 'filter',
      "description": 'Filter criteria for tunes',
      "type": 3,
      "required": true,
    }
  ],
  integration_types: [0, 1],
  contexts: [0, 1],
};

const ALL_COMMANDS = [TUNE_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);