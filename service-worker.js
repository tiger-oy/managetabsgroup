chrome.runtime.onInstalled.addListener(function (details) {
    console.log('onInstalled:' + details.reason);

});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Request ", request);
    let messageType = request?.messageType;

    handleMessage[messageType](request, sender, sendResponse);
    return true;
});

const handleMessage = {
    "data": {},
    "setData": (data) => {
        handleMessage.data = data;
    },
    "getData": () => {
        return handleMessage.data;
    },
    "MOVE_WINDOW_DATA": (request, sender, sendResponse) => {
        let data = request.data;
        handleMessage.setData(data);
        if (sendResponse) {
            sendResponse();
        }
    },
    "RESET_WINDOW_DATA": async (request, sender, sendResponse) => {
        if (sendResponse) {
            let data = handleMessage.getData();
            handleMessage.setData({});
            sendResponse(data);
        }
    }
}