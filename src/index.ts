#!/usr/bin/env node

/**
 * FireDrill CLI — broadcast iMessages via macOS Messages.app.
 *
 * Usage:
 *   firedrill contacts list   — list contacts from Contacts.app or file
 *   firedrill contacts groups — list Contacts.app groups
 *   firedrill send             — send an iMessage to one or many recipients
 */

import { program } from "commander";
import { registerContactsCommand } from "./commands/contacts.js";
import { registerSendCommand } from "./commands/send.js";

program
  .name("firedrill")
  .description("Broadcast iMessages via macOS Messages.app")
  .version("0.1.0");

registerContactsCommand(program);
registerSendCommand(program);

program.parse();
