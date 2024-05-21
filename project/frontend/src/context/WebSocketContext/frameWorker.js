/* eslint-env worker */
/* eslint-disable no-restricted-globals */

console.log('frameWorker: Worker script started.');

self.onmessage = (e) => {
    console.log('frameWorker: Received message', e.data);

    const { frame, mime } = e.data;
    const byteCharacters = atob(frame);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mime });

    console.log('frameWorker: Processed frame, sending blob URL.');
    self.postMessage(URL.createObjectURL(blob));
};

/* eslint-enable no-restricted-globals */
