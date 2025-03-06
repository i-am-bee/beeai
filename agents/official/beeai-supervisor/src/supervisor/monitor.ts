#!/usr/bin/env -S npx -y tsx@latest

import { Monitor } from "@i-am-bee/beeai-supervisor/ui/monitor.js";

new Monitor().start("./output");
