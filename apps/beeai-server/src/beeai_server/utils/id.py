# Copyright 2025 IBM Corp.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import platform
import hashlib
import binascii


def generate_stable_id(length=16) -> str:
    try:
        # Use os.uname() for Unix-like systems
        uname_info = os.uname()
        # Only use stable attributes: sysname, nodename, machine to make it more stable
        base_info = "".join([uname_info.sysname, uname_info.nodename, uname_info.machine])
    except AttributeError:
        # Fallback for Windows
        system_info = [
            platform.system(),  # OS name
            platform.node(),  # Hostname
            platform.machine(),  # Machine type
        ]
        base_info = "".join(system_info)

    derived_key = hashlib.pbkdf2_hmac("sha256", base_info.encode("utf-8"), b"x", 1000, dklen=length)

    return binascii.hexlify(derived_key).decode("utf-8")[: length * 2]  # 2 hex chars per byte
