const useHotReloading = false;

import { hot } from "react-hot-loader/root";
import React from "react";
import { render } from "react-dom";
import { UIRunStatus as UIRunStatus0 } from "./UIRunStatus";
import { globalUIState, GlobalUIState, RunStatus, runStatus } from "./RunStatus";
import { SnackbarProvider, useSnackbar } from "notistack";
import { useObserver } from "mobx-react-lite";

let UIRunStatus = useHotReloading ? hot(UIRunStatus0) : UIRunStatus0;

export const UIMain: React.FC<{ runStatus: RunStatus; globalUIState: GlobalUIState }> = ({
    runStatus,
    globalUIState,
}) => {
    const { enqueueSnackbar } = useSnackbar();
    globalUIState.notification = enqueueSnackbar;
    globalUIState.info = (s: string) => enqueueSnackbar(s, { variant: "info" });
    globalUIState.success = (s: string) => enqueueSnackbar(s, { variant: "success" });
    globalUIState.warn = (s: string) => enqueueSnackbar(s, { variant: "warning" });
    globalUIState.error = (s: string) => enqueueSnackbar(s, { variant: "error" });
    globalUIState.showResponse = (response: any, ui_success_message?: string) => {
        const { data } = response;
        if (data.warn) globalUIState.warn((ui_success_message || "") + " Warning!");
        else if (data.ok) globalUIState.success(ui_success_message || "OK!");
        else {
            globalUIState.error("Error: " + data.error);
            console.error(`CODE00000000 Server response`, response);
        }
    };

    return useObserver(() => (
        <>
            <UIRunStatus runStatus={runStatus} globalUIState={globalUIState} />
        </>
    ));
};

(async () => {
    console.log(`Use localStorage.debug = '...' to change debug output!`);
    let root = document.querySelector("#root");
    if (!root) {
        root = document.createElement("div");
        root.id = "root";
        document.body.appendChild(root);
    }

    console.log(`Starting...`);
    console.log(`globalUIState = `, globalUIState);
    render(
        <SnackbarProvider maxSnack={3}>
            <UIMain runStatus={runStatus} globalUIState={globalUIState} />
        </SnackbarProvider>,
        root
    );
})();

if ((module as any).hot) {
    (module as any).hot.accept();
}
