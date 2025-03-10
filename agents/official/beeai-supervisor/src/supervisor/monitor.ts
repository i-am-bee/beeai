#!/usr/bin/env -S npx -y tsx@latest

import { Monitor } from "@i-am-bee/beeai-supervisor/ui/monitor.js";
import { OUTPUT_DIR } from "./supervisor.js";
import process from 'process';

// Get output directory from command line args if provided
// The first two arguments are node and script name, so we check for the third
const cmdOutputDir = process.argv[2];

// Use command line arg if provided, otherwise fall back to imported OUTPUT_DIR
const outputDir = cmdOutputDir || OUTPUT_DIR;

new Monitor().start(outputDir);
