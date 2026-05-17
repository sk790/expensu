import { useState, useCallback } from "react";

/**
 * useAlert hook — drop-in replacement for React Native's Alert.alert()
 *
 * Usage:
 *   const { alertProps, showAlert } = useAlert();
 *   <CustomAlert {...alertProps} />
 *
 *   showAlert({ type: "success", title: "Done!", message: "It worked." });
 *   showAlert({ type: "error", title: "Oops", message: "Something went wrong." });
 *   showAlert({ type: "confirm", title: "Sure?", message: "This can't be undone.", buttons: [
 *     { text: "Cancel", style: "cancel" },
 *     { text: "Delete", style: "destructive", onPress: () => doDelete() },
 *   ]});
 */
export function useAlert() {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    buttons: [],
    dismissible: true,
  });

  const showAlert = useCallback(({ type = "info", title = "", message = "", buttons = [], dismissible = true }) => {
    setAlertConfig({ visible: true, type, title, message, buttons, dismissible });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const alertProps = {
    visible: alertConfig.visible,
    type: alertConfig.type,
    title: alertConfig.title,
    message: alertConfig.message,
    buttons: alertConfig.buttons,
    dismissible: alertConfig.dismissible,
    onDismiss: hideAlert,
  };

  return { alertProps, showAlert, hideAlert };
}
