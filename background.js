browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTabInfo") {
    browser.tabs.query({}).then((tabs) => {
      let tabData = tabs.map((tab) => ({
        title: tab.title,
        tabId: tab.id,
        url: tab.url,
      }));
      sendResponse({ tabData });
    });
    return true;
  }

  if (message.action === "storeTab") {
    browser.tabs.remove(message.tabId).then(() => {
      browser.storage.local.get({ storedTabs: [] }).then((data) => {
        let storedTabs = data.storedTabs;
        storedTabs.push({ title: message.title, url: message.url });
        browser.storage.local.set({ storedTabs }).then(() => {
          sendResponse(); // Ensure response is sent
        });
      });
    });
    return true;
  }

  if (message.action === "restoreTab") {
    browser.tabs.create({ url: message.url });
    sendResponse();
    return true;
  }

  if (message.action === "deleteStoredTab") {
    browser.storage.local.get({ storedTabs: [] }).then((data) => {
      let storedTabs = data.storedTabs.filter((tab) => tab.url !== message.url);
      browser.storage.local.set({ storedTabs }).then(() => {
        sendResponse();
      });
    });
    return true;
  }

  if (message.action === "restoreAllTabs") {
    browser.storage.local.get({ storedTabs: [] }).then((data) => {
      data.storedTabs.forEach((tab) => {
        browser.tabs.create({ url: tab.url });
      });
    });
    sendResponse();
    return true;
  }

  if (message.action === "deleteAllStoredTabs") {
    browser.storage.local.set({ storedTabs: [] }).then(() => {
      sendResponse();
    });
    return true;
  }

  if (message.action === "storeAllExceptCurrent") {
    browser.tabs.query({ currentWindow: true }).then((tabs) => {
      // Filter out the current tab
      let tabsToStore = tabs.filter((tab) => tab.id !== message.currentTabId);

      // Use the same logic for storing and removing each tab
      let storePromises = tabsToStore.map((tab) => {
        return browser.tabs.remove(tab.id).then(() => {
          return browser.storage.local.get({ storedTabs: [] }).then((data) => {
            let storedTabs = data.storedTabs || [];
            storedTabs.push({ title: tab.title, url: tab.url });
            return browser.storage.local.set({ storedTabs });
          });
        });
      });

      // Wait for all tabs to be stored and removed before sending the response
      Promise.all(storePromises).then(() => {
        sendResponse();
      });
    });
    return true;
  }

  return true;
});
