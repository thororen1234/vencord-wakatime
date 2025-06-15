/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin, { OptionType } from '@utils/types';
import { showNotification } from "@api/Notifications";
import { definePluginSettings } from '@api/Settings';

const settings = definePluginSettings({
    apiKey: {
        type: OptionType.STRING,
        description: 'API Key for wakatime',
        default: '',
        isValid: (e: string) => {
            if (!e) return "Invalid Key: Please change the default API Key";
            if (!e.startsWith("waka_")) return "Invalid Key: Key must start with 'waka_'";
            return true;
        },
    },
    debug: {
        type: OptionType.BOOLEAN,
        description: 'Enable debug mode',
        default: false,
    },
    machineName: {
        type: OptionType.STRING,
        description: 'Machine name',
        default: 'Vencord User',
    },
    projectName: {
        type: OptionType.STRING,
        description: "Project Name",
        default: "Discord",
    },
});

async function sendHeartbeat(time) {
    const key = settings.store.apiKey;
    if (!key) {
        showNotification({
            title: "WakaTime",
            body: "No api key for wakatime is setup.",
            color: "var(--red-360)",
        });

        return;
    }
    if (settings.store.debug) {
        console.log('Sending heartbeat to WakaTime API.');
    }

    const url = 'https://api.wakatime.com/api/v1/users/current/heartbeats';
    const body = JSON.stringify({
        time: time / 1000,
        entity: 'Discord',
        type: 'app',
        project: settings.store.projectName ?? "Discord",
        plugin: 'vencord/version discord-wakatime/v0.0.1',
    });
    const headers = {
        Authorization: `Basic ${key}`,
        'Content-Type': 'application/json',
        'Content-Length': new TextEncoder().encode(body).length.toString(),
    };
    const machine = settings.store.machineName;
    if (machine) headers['X-Machine-Name'] = machine;
    const response = await fetch(url, {
        method: 'POST',
        body: body,
        headers: headers,
    });
    const data = await response.text();
    if (response.status < 200 || response.status >= 300) console.warn(`WakaTime API Error ${response.status}: ${data}`);
}

export default definePlugin({
    name: 'Wakatime',
    description: 'Fully automatic code stats via Wakatime',
    authors: [
        {
            id: 566766267046821888n,
            name: 'Neon',
        },
    ],
    settings,
    start() {
        this.updateInterval = setInterval(async () => {
            const time = Date.now();
            await sendHeartbeat(time);
        }, 120000);
    },
    stop() {
        clearInterval(this.updateInterval);
    },
});