chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((message, sender) => {
  (async () => {
    if (message.action === "open_side_panel") {
      await chrome.sidePanel.open({
        tabId: sender.tab.id,
        windowId: sender.tab.windowId,
      });
    }
  })();
});
