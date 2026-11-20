// frontend/src/utils/device.js
// Generates and persists a unique client device identifier and readable device name.

export function getDeviceId() {
  if (typeof window === 'undefined') return 'unknown_device';

  let deviceId = localStorage.getItem('nex_device_id');
  if (!deviceId) {
    try {
      // Use crypto random UUID if available
      if (window.crypto && window.crypto.randomUUID) {
        deviceId = 'dev_' + window.crypto.randomUUID();
      } else {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      }
    } catch {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
    localStorage.setItem('nex_device_id', deviceId);
  }
  return deviceId;
}

export function getDeviceName() {
  if (typeof navigator === 'undefined') return 'Web Browser';

  const ua = navigator.userAgent || '';

  let os = 'Unknown Device';
  if (/Android/i.test(ua)) {
    os = 'Android Phone';
  } else if (/iPhone/i.test(ua)) {
    os = 'iPhone';
  } else if (/iPad/i.test(ua)) {
    os = 'iPad';
  } else if (/Windows NT/i.test(ua)) {
    os = 'Windows PC';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'Mac';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux Device';
  }

  let browser = 'Browser';
  if (/Edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/Chrome|CriOS/i.test(ua) && !/Edg\//i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = 'Firefox';
  }

  return `${os} · ${browser}`;
}
