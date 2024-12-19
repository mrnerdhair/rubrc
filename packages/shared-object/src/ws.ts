/*
 * Project: https://github.com/oligamiq/SharedObject
 * Copyright (c) 2024 oligamiq
 *
 * Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 * and the MIT License (see LICENSE-MIT for details).
 */

/// <reference types="@types/serviceworker" />

const workerThis: ServiceWorkerGlobalScope = globalThis as unknown as ServiceWorkerGlobalScope;

workerThis.onmessage = (event) => {
}
