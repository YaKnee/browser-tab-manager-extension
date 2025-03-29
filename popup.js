document.addEventListener("DOMContentLoaded", function () {
  const tabList = document.getElementById("tab-list");
  const storedTabList = document.getElementById("stored-tab-list");
  const openTabButton = document.getElementById("open-tabs-btn");
  const storedTabButton = document.getElementById("stored-tabs-btn");
  const storeAllBtn = document.getElementById("store-all-btn");
  const restoreAllBtn = document.getElementById("restore-all-btn");
  const deleteAllBtn = document.getElementById("delete-all-btn");
  const openTabSection = document.getElementById("open-tabs");
  const storedTabSection = document.getElementById("stored-tabs");

  function loadOpenTabs() {
    tabList.innerHTML = "";
    browser.runtime.sendMessage({ action: "getTabInfo" }).then((response) => {
      response.tabData.forEach((tab) => {
        const tabItem = document.createElement("div");
        tabItem.classList.add("tab-item");

        const title = document.createElement("span");
        title.classList.add("tab-item-title");
        title.textContent = tab.title;

        const storeButton = document.createElement("button");
        storeButton.textContent = "Store";
        storeButton.addEventListener("click", () => {
          browser.runtime
            .sendMessage({
              action: "storeTab",
              tabId: tab.tabId,
              title: tab.title,
              url: tab.url,
            })
            .then(() => {
              loadOpenTabs();
              loadStoredTabs();
            });
        });

        tabItem.appendChild(title);
        tabItem.appendChild(storeButton);
        tabList.appendChild(tabItem);
      });
    });
  }

  function loadStoredTabs() {
    storedTabList.innerHTML = "";
    browser.storage.local.get({ storedTabs: [] }).then((data) => {
      data.storedTabs.forEach((tab) => {
        const tabItem = document.createElement("div");
        tabItem.classList.add("tab-item");

        const title = document.createElement("span");
        title.classList.add("tab-item-title");
        title.textContent = tab.title;

        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        const restoreButton = document.createElement("button");
        restoreButton.textContent = "Restore";
        restoreButton.addEventListener("click", () => {
          browser.runtime
            .sendMessage({ action: "restoreTab", url: tab.url })
            .then(() => {
              browser.runtime
                .sendMessage({ action: "deleteStoredTab", url: tab.url })
                .then(() => {
                  loadStoredTabs();
                });
            });
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete");
        deleteButton.addEventListener("click", () => {
          browser.runtime
            .sendMessage({ action: "deleteStoredTab", url: tab.url })
            .then(() => {
              loadStoredTabs();
            });
        });

        tabItem.appendChild(title);
        buttonContainer.appendChild(restoreButton);
        buttonContainer.appendChild(deleteButton);
        tabItem.appendChild(buttonContainer);
        storedTabList.appendChild(tabItem);
      });
    });
  }

  openTabButton.addEventListener("click", () => {
    openTabSection.style.display = "block";
    storedTabSection.style.display = "none";
    openTabButton.classList.add("active");
    storedTabButton.classList.remove("active");
    loadOpenTabs();
  });

  storedTabButton.addEventListener("click", () => {
    openTabSection.style.display = "none";
    storedTabSection.style.display = "block";
    storedTabButton.classList.add("active");
    openTabButton.classList.remove("active");
    loadStoredTabs();
  });

  storeAllBtn.addEventListener("click", () => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      browser.runtime
        .sendMessage({
          action: "storeAllExceptCurrent",
          currentTabId: tabs[0].id,
        })
        .then(() => {
          loadOpenTabs();
          loadStoredTabs();
        });
    });
  });

  restoreAllBtn.addEventListener("click", () => {
    browser.runtime.sendMessage({ action: "restoreAllTabs" }).then(() => {
      browser.runtime.sendMessage({ action: "deleteAllStoredTabs" }).then(() => {
        loadStoredTabs();
      });
    });
  });

  deleteAllBtn.addEventListener("click", () => {
    browser.runtime.sendMessage({ action: "deleteAllStoredTabs" }).then(() => {
      loadStoredTabs();
    });
  });

  loadOpenTabs();
  loadStoredTabs();
});
