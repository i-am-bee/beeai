#!/usr/bin/env npx -y tsx@latest

import { Monitor } from "beeai-supervisor/ui/monitor.js";

new Monitor().start("./output");
