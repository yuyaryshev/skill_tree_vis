import { observable } from "mobx";
import axios from "axios";
import moment from "moment";
import debugjs from "debug";
import React from "react";

const MAX_LOG_ITEMS = 300;
const debugReload = debugjs("reload");

moment.locale("ru");

type Severity = "F" | "E" | "W" | "I" | "D";

export const reformatDate = (t: any, prop: string) => {
    t[prop] = t[prop] ? moment(t[prop]).format("HH:mm:ss - DD.MM.YYYY (dddd)") : "";
    return t[prop];
};

const copyPrimitiveFields = (target: any, source: any) => {
    for (let k in source) if (typeof source[k] !== "object" && target[k] !== source[k]) target[k] = source[k];
};

export class RunStatus {
    @observable instanceName = "???";
    @observable versionStr = "?.?.?";
    @observable connected = false;
    @observable globalMessages: any = {};
    @observable lastRun = "";
    @observable jiraTime = "";
    @observable streams = [];
    @observable issues: any[] = [];
    @observable jobs: any[] = [];
    @observable logs: any[] = [];
    @observable issueStats: any = {};
    @observable jobStats: any = {};
    @observable knownErrors: any[] = [];
    @observable lastRefresh = "";
    @observable jiraStatus: any = {};
    @observable resurses: any = {};
    @observable projectsAnalysis: any[] = [];

    // @computed
    // get computedExample() {
    //     return `This is a computed value: this.selectedItem.id = ${(this.selectedItem || {}).id}, this.title=${this.title}`;
    // }
}

export class RunStreamStatus {
    @observable id = "";
    @observable lastRun = "";
    @observable lastRunOk = undefined;
    @observable lastCount = 0;
    @observable lastTotal = 0;
    @observable countToday = 0;
    @observable count10min = 0;
    @observable errors = [];
    @observable status = "";
    @observable partStatuses = [];

    // @computed
    // get computedExample() {
    //     return `This is a computed value: this.selectedItem.id = ${(this.selectedItem || {}).id}, this.title=${this.title}`;
    // }
}

export type TabName = "Issues" | "Jobs" | "Logs" | "IssueStats" | "JobStats";
export const tabNames: TabName[] = ["Issues", "Jobs", "Logs", "IssueStats", "JobStats"];

export class GlobalUIState {
    @observable jobDetailsInGrid: boolean = false;
    @observable issue_stats_checkProjects: boolean = true;
    @observable issue_stats_checkAll: boolean = false;
    @observable job_stats_checkProjects: boolean = true;
    @observable job_stats_checkAll: boolean = false;
    @observable jobsFilter: string | undefined;
    @observable logsFilter: string | undefined;
    @observable statusTab: TabName = "Issues";

    notification!: (s: string, opts: any) => void;
    info!: (s: string) => void;
    success!: (s: string) => void;
    warn!: (s: string) => void;
    error!: (s: string) => void;
    showResponse!: (response: any, ui_success_message?: string) => void;

    toggleJobDetailsInGrid: () => void;
    requestFullRefresh: () => Promise<void>;
    setJobsFilter: (event: any) => void;
    setLogsFilter: (event: any) => void;
    statusTabChanged: (event: any, newValue: number) => void;

    constructor() {
        const pthis = this;
        this.toggleJobDetailsInGrid = () => {
            pthis.jobDetailsInGrid = !pthis.jobDetailsInGrid;
        };

        this.requestFullRefresh = async () => {
            shouldRequestFullRefresh = true;
            waitingForFullRefresh = true;
            console.log(`Requested full refresh!`);
        };

        this.setJobsFilter = event => {
            pthis.jobsFilter = event.target.value;
        };

        this.setLogsFilter = event => {
            pthis.logsFilter = event.target.value;
        };

        this.statusTabChanged = (event, newValue) => {
            console.log("this.statusTabChanged2 = ", event.target);
            pthis.statusTab = tabNames[newValue]; //newValue
        };
    }
}

export const globalUIState = new GlobalUIState();

let shouldRequestFullRefresh = true;
let waitingForFullRefresh = true;

export class AnalysisItem {
    @observable project: string | undefined;
    @observable args: number | undefined;
    @observable succededJobs: number | undefined;
    @observable failedJobs: number | undefined;
    @observable runningJobs: number | undefined;

    constructor() {
        const pthis = this;
    }
}

export class LogItem {
    @observable ts: string | undefined;
    @observable cpl: string | undefined;
    @observable severity: Severity | undefined;
    @observable message: string | undefined;
    @observable data: string | undefined;

    constructor() {
        const pthis = this;
    }
}

export class JobStatus {
    @observable id: string | undefined;
    @observable parent: string | undefined;
    @observable key: string | undefined;
    @observable priority: string | undefined;
    @observable cancelled: string | undefined;
    @observable predecessorsDone: string | undefined;
    @observable createdTs: string | undefined;
    @observable finishedTs: string | undefined;
    @observable jobType: string | undefined;
    @observable succeded: string | undefined;
    @observable startedTs: string | undefined;
    @observable prevError: string | undefined;
    @observable retryIntervalIndex: string | undefined;
    @observable nextRunTs: string | undefined;
    @observable input: string | undefined;
    @observable prevResult: string | undefined;
    @observable paused: string | undefined;
    @observable timesSaved: string | undefined;
    @observable updatedTs: string | undefined;
    @observable deleted: string | undefined;

    resume: () => Promise<void>;
    pause: () => Promise<void>;
    makeStale: () => Promise<void>;

    // @computed
    // get computedExample() {
    //     return `This is a computed value: this.selectedItem.id = ${(this.selectedItem || {}).id}, this.title=${this.title}`;
    // }
    constructor() {
        const pthis = this;

        this.resume = async () => {
            const response = await axios.get("api/jobResume", {
                params: {
                    jobId: pthis.id,
                },
            });
            globalUIState.showResponse(response, `Job ${pthis.id} resumed!`);
        };

        this.pause = async () => {
            const response = await axios.get(urlBase + "api/jobPause", {
                params: {
                    jobId: pthis.id,
                },
            });
            globalUIState.showResponse(response, `Job ${pthis.id} paused!`);
        };

        this.makeStale = async () => {
            const response = await axios.get(urlBase + "api/jobMakeStale", {
                params: {
                    jobId: pthis.id,
                },
            });
            globalUIState.showResponse(response, `Job ${pthis.id} made stale!`);
        };
    }
}

export const runStatus = new RunStatus();
let urlBase: string = "";

let lastReloadTs: moment.Moment | undefined = undefined;

const severityLongStr = (severity: Severity): string => {
    switch (severity) {
        case "D":
            return "DEBUG";
        case "E":
            return "ERROR";
        case "F":
            return "FATAL";
        case "I":
            return "INFO ";
        case "W":
            return "WARN ";
    }
    return "ERROR";
};

async function reloadData() {
    debugReload(`Started reloadData`);
    runStatus.lastRefresh = moment().format("HH:mm:ss");
    try {
        if (!urlBase) {
            urlBase = window.location.href;
            if (!urlBase.endsWith("/")) urlBase = urlBase + "/";
        }

        // Получаем общий статус программы
        {
            const { data } = await axios.get(urlBase + "api/status", {
                params: {
                    ts: (!shouldRequestFullRefresh && lastReloadTs && lastReloadTs.format()) || undefined,
                    filter: globalUIState.jobsFilter ? globalUIState.jobsFilter.trim() : undefined,
                },
            });

            runStatus.jiraStatus = data.jiraStatus;
            runStatus.globalMessages = data.globalMessages;
            runStatus.connected = true;
            runStatus.resurses = data.resurses;
        }

        if (globalUIState.statusTab === "Issues") {
            const { data } = await axios.get(urlBase + "api/issues", {
                params: {
                    ts: (!shouldRequestFullRefresh && lastReloadTs && lastReloadTs.format()) || undefined,
                    filter: globalUIState.jobsFilter ? globalUIState.jobsFilter.trim() : undefined,
                },
            });

            shouldRequestFullRefresh = false;
            lastReloadTs = moment(data.ts);
            reformatDate(data, "lastRun");
            reformatDate(data, "jiraTime");

            for (let job of data.issues) {
                reformatDate(job, "updatedTs");
                reformatDate(job, "startedTs");
                reformatDate(job, "finishedTs");
                reformatDate(job, "createdTs");
                reformatDate(job, "nextRetryTs");
            }

            copyPrimitiveFields(runStatus, data);

            if (data.fullRefresh) {
                if (waitingForFullRefresh) {
                    waitingForFullRefresh = false;
                    globalUIState.info("Status was fully refreshed!");
                }

                L_outter1: for (let i = runStatus.issues.length - 1; i >= 0; i--) {
                    const clientJob: any = runStatus.issues[i];
                    for (let job of data.issues) if (clientJob.id === job.id) continue L_outter1;
                    runStatus.issues.splice(i, 1);
                }

                runStatus.logs.length = 0;
            }

            L_outter21: for (let job of data.issues) {
                for (let clientJob of runStatus.issues) {
                    if (clientJob.id === job.id) {
                        // MATCH
                        copyPrimitiveFields(clientJob, job);
                        clientJob.jsonUpper = JSON.stringify(job).toUpperCase();
                        if (clientJob.deleted) {
                            // Schedule to delete later
                            setTimeout(() => {
                                //if (clientJob.deleted) containerDelete(runStatus.issues, clientJob);
                            }, 10 * 1000);
                        }
                        continue L_outter21;
                    }
                }

                // NO MATCH
                const clientJob = new JobStatus();
                copyPrimitiveFields(clientJob, job);
                runStatus.issues.push(clientJob);
            }

            if (runStatus.logs.length > MAX_LOG_ITEMS) runStatus.logs.splice(0, runStatus.logs.length - MAX_LOG_ITEMS);

            runStatus.issues = data.issues;
            runStatus.jobs = [];
            runStatus.logs = [];
            runStatus.issueStats = {};
            runStatus.jobStats = {};

            document.title = "issue_loader: " + runStatus.instanceName;

            /// если выбрана таблица jobs
        } else if (globalUIState.statusTab === "Jobs") {
            const { data } = await axios.get(urlBase + "api/jobs", {
                params: {
                    ts: (!shouldRequestFullRefresh && lastReloadTs && lastReloadTs.format()) || undefined,
                    filter: globalUIState.jobsFilter ? globalUIState.jobsFilter.trim() : undefined,
                },
            });

            shouldRequestFullRefresh = false;
            lastReloadTs = moment(data.ts);
            reformatDate(data, "lastRun");
            reformatDate(data, "jiraTime");

            for (let job of data.jobs) {
                reformatDate(job, "updatedTs");
                reformatDate(job, "startedTs");
                reformatDate(job, "finishedTs");
                reformatDate(job, "createdTs");
                reformatDate(job, "nextRetryTs");
            }

            copyPrimitiveFields(runStatus, data);

            if (data.fullRefresh) {
                if (waitingForFullRefresh) {
                    waitingForFullRefresh = false;
                    globalUIState.info("Status was fully refreshed!");
                }

                L_outter1: for (let i = runStatus.jobs.length - 1; i >= 0; i--) {
                    const clientJob: any = runStatus.jobs[i];
                    for (let job of data.jobs) if (clientJob.id === job.id) continue L_outter1;
                    runStatus.jobs.splice(i, 1);
                }

                runStatus.logs.length = 0;
            }

            L_outter21: for (let job of data.jobs) {
                for (let clientJob of runStatus.jobs) {
                    if (clientJob.id === job.id) {
                        // MATCH
                        copyPrimitiveFields(clientJob, job);
                        clientJob.jsonUpper = JSON.stringify(job).toUpperCase();
                        if (clientJob.deleted) {
                            // Schedule to delete later
                            setTimeout(() => {
//                                if (clientJob.deleted) containerDelete(runStatus.jobs, clientJob);
                            }, 10 * 1000);
                        }
                        continue L_outter21;
                    }
                }

                // NO MATCH
                const clientJob = new JobStatus();
                copyPrimitiveFields(clientJob, job);
                runStatus.jobs.push(clientJob);
            }

            if (runStatus.logs.length > MAX_LOG_ITEMS) runStatus.logs.splice(0, runStatus.logs.length - MAX_LOG_ITEMS);

            runStatus.issues = [];
            runStatus.jobs = data.jobs;
            runStatus.logs = [];
            runStatus.issueStats = {};
            runStatus.jobStats = {};

            document.title = "issue_loader: " + runStatus.instanceName;

            /// если выбрана таблица log
        } else if (globalUIState.statusTab === "Logs") {
            const { data } = await axios.get(urlBase + "api/logs", {
                params: {},
            });

            shouldRequestFullRefresh = false;
            lastReloadTs = moment(data.ts);

            for (let log of data.logs) {
                reformatDate(log, "ts");
                log.severity = severityLongStr(log.severity);
            }

            copyPrimitiveFields(runStatus, data);

            for (let log of data.logs) {
                const clientLog = new LogItem();
                copyPrimitiveFields(clientLog, log);
                runStatus.logs.push(clientLog);
            }

            runStatus.logs = data.logs;

            if (runStatus.logs.length > MAX_LOG_ITEMS) runStatus.logs.splice(0, runStatus.logs.length - MAX_LOG_ITEMS);

            runStatus.issues = [];
            runStatus.jobs = [];
            runStatus.issueStats = {};
            runStatus.jobStats = {};

            document.title = "issue_loader: " + runStatus.instanceName;

            /// если выбрана таблица stats
        } else if (globalUIState.statusTab === "IssueStats") {
            //runStatus.projectsAnalysis = [];
            const { data } = await axios.get(urlBase + "api/issueStats", {
                params: {
                    ts: (!shouldRequestFullRefresh && lastReloadTs && lastReloadTs.format()) || undefined,
                },
            });

            for (let projectAnalysis of data.stats) {
                reformatDate(projectAnalysis, "minTs");
                reformatDate(projectAnalysis, "maxTs");
            }

            runStatus.issues = [];
            runStatus.issueStats = { stats: data.stats, error: data.error };
            runStatus.jobStats = {};
            runStatus.logs = [];
            runStatus.jobs = [];

            /////////////////////////////////////////////////////// drop else
        } else if (globalUIState.statusTab === "JobStats") {
            //runStatus.projectsAnalysis = [];
            const { data } = await axios.get(urlBase + "api/jobStats", {
                params: {
                    ts: (!shouldRequestFullRefresh && lastReloadTs && lastReloadTs.format()) || undefined,
                },
            });

            for (let projectAnalysis of data.stats) {
                reformatDate(projectAnalysis, "minTs");
                reformatDate(projectAnalysis, "maxTs");
            }

            runStatus.issues = [];
            runStatus.jobStats = { stats: data.stats, error: data.error };
            runStatus.issueStats = {};
            runStatus.logs = [];
            runStatus.jobs = [];

            /////////////////////////////////////////////////////// drop else
        }
        debugReload(`Finished reloadData - OK`);
    } catch (e) {
        // runStatus.streams = [];
        runStatus.issues = [];
        runStatus.jobs = [];
        runStatus.logs = [];
        runStatus.projectsAnalysis = [];
        runStatus.jiraTime = "";
        delete runStatus.lastRefresh;
        console.error(`Finished reloadData - ERROR`, e);
    }
    setTimeout(reloadData, 300);
}

reloadData();

if ((module as any).hot) {
    (module as any).hot.accept();
}

/*
const { data } = await axios.get(urlBase + "api/status", {
                params: {
                    ts: (!shouldRequestFullRefresh && lastReloadTs && lastReloadTs.format()) || undefined,
                },
            });

            shouldRequestFullRefresh = false;
            lastReloadTs = moment(data.ts);
            reformatDate(data, "lastRun");
            reformatDate(data, "jiraTime");

            for (let job of data.jobs) {
                reformatDate(job, "updatedTs");
                reformatDate(job, "startedTs");
                reformatDate(job, "finishedTs");
                reformatDate(job, "createdTs");
                reformatDate(job, "nextRetryTs");
            }
            for (let log of data.logs) {
                reformatDate(log, "ts");
                log.severity = severityLongStr(log.severity);
            }

            copyPrimitiveFields(runStatus, data);

            if (data.fullRefresh) {
                if (waitingForFullRefresh) {
                    waitingForFullRefresh = false;
                    globalUIState.info("Status was fully refreshed!");
                }

                L_outter1: for (let i = runStatus.jobs.length - 1; i >= 0; i--) {
                    const clientJob = runStatus.jobs[i];
                    for (let job of data.jobs) if (clientJob.id === job.id) continue L_outter1;
                    runStatus.jobs.splice(i, 1);
                }

                runStatus.logs.length = 0;
            }

            L_outter21: for (let job of data.jobs) {
                for (let clientJob of runStatus.jobs) {
                    if (clientJob.id === job.id) {
                        // MATCH
                        copyPrimitiveFields(clientJob, job);
                        clientJob.jsonUpper = JSON.stringify(job).toUpperCase();
                        if (clientJob.deleted) {
                            // Schedule to delete later
                            setTimeout(() => {
                                if (clientJob.deleted) containerDelete(runStatus.jobs, clientJob);
                            }, 10 * 1000);
                        }
                        continue L_outter21;
                    }
                }

                // NO MATCH
                const clientJob = new JobStatus();
                copyPrimitiveFields(clientJob, job);
                runStatus.jobs.push(clientJob);
            }

            for (let log of data.logs) {
                const clientLog = new LogItem();
                copyPrimitiveFields(clientLog, log);
                runStatus.logs.push(clientLog);
            }

            if (runStatus.logs.length > MAX_LOG_ITEMS) runStatus.logs.splice(0, runStatus.logs.length - MAX_LOG_ITEMS);

            runStatus.connected = true;
            document.title = "issue_loader: " + runStatus.instanceName;
 */
