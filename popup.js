// 在popup.html的页面里，Dom内容加载完毕后执行
document.addEventListener('DOMContentLoaded', function (event) {

    document.getElementById('merge-tab-domain').onclick = mergeTabDomain;
    document.getElementById('merge-tab-cancle').onclick = mergeTabCancel;
    document.getElementById('remove-tab-duplicated').onclick = removeTabDuplicated;
    document.getElementById('merge-windows').onclick = mergeWindows;
    document.getElementById('reset-windows').onclick = resetWindows;

});

const mergeTabDomain = () => {

    chrome.tabs.query({},
        async function (tabs) {
            let tabData = {};
            let activeTab = null;
            tabs.filter(tab => tab.groupId == -1 ).forEach(tab => {
      
                if (tab.active) {
                    activeTab = tab;
                }
                let url = tab.url;
                let urlObj = new URL(url);

                let hostName = urlObj.hostname;
                let start = hostName.indexOf('.');
                let end = hostName.lastIndexOf('.');
                if (start != end) {
                    start = start + 1;
                    if (start != end) {
                        hostName = hostName.substring(start, end);
                    }
                }
                let hostData = tabData[hostName];
                if (hostData) {
                    tabData[hostName].push(tab.id);
                } else {
                    tabData[hostName] = [tab.id];
                }
            });
           
            for (var prop in tabData) {
                let tabIds = tabData[prop];
                if (tabIds.length > 1) {
                    const group = await chrome.tabs.group({ tabIds });
                    let collapsed = !tabIds.includes(activeTab.id);
                    await chrome.tabGroups.update(group, { title: prop, collapsed: collapsed });
                }

            }


        }
    );

}

const mergeTabCancel = async () => {


    chrome.tabs.query({},
        async function (tabs) {

            let groupData = {};
            tabs.forEach(tab => {
                let tabGroup = groupData[tab.groupId];
                if (tabGroup) {
                    groupData[tab.groupId].push(tab.id);
                } else {
                    groupData[tab.groupId] = [tab.id];
                }

            })

            for (var prop in groupData) {
                let tabIds = groupData[prop];
                await chrome.tabs.ungroup(tabIds);

            }
        });
}


const removeTabDuplicated = () => {

    chrome.tabs.query({},
        async function (tabs) {

            let tabUrls = [];
            tabs.forEach(tab => {
                if (tabUrls.includes(tab.url)) {
                    chrome.tabs.remove(tab.id);
                } else {
                    tabUrls.push(tab.url);
                }
            })

        });


}

const mergeWindows = () => {

    chrome.tabs.query({},
        async function (tabs) {

            let windowData = {};
            let moveWindowData = {};
            tabs.forEach(tab => {
                if (windowData[tab.windowId]) {
                    windowData[tab.windowId].push(tab);
                } else {
                    windowData[tab.windowId] = [tab];
                }
            });

            let lastWindowId = null;
            for (var windowId in windowData) {
                if (!lastWindowId) {
                    lastWindowId = windowId;
                }

                if (windowId != lastWindowId) {
                    moveWindowData[windowId] = windowData[windowId];

                    for (var tab of windowData[windowId]) {
                        console.log('tab:', tab);
                        await chrome.tabs.move(tab.id, { index: -1, windowId: parseInt(lastWindowId) });
                    }
                }
            }

            let keys = Object.keys(moveWindowData);
            if (keys.length != 0) {
                chrome.runtime.sendMessage({ messageType: "MOVE_WINDOW_DATA", data: moveWindowData }, function (response) {
                    console.log('send msg done', response);
                });
            }

        });

}
const resetWindows = async () => {
    let activeTab = await chrome.tabs.query({active: true});
    
    chrome.runtime.sendMessage({ messageType: "RESET_WINDOW_DATA" }, async function (data) {
        console.log('data',data);
        for (const windowId in data) {
            let tabIds = [];
            for (var tab of data[windowId]) {
                tabIds.push(tab.id);
            }
            let newWindow = await chrome.windows.create({ tabId: tabIds.pop() });
            let newWindowId = newWindow.id;
            if (tabIds.length > 0) {
                await chrome.tabs.move(tabIds, { index: -1, windowId: newWindowId });
            }
        }

    });
}