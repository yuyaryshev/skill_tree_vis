import React from "react";
import { useObserver } from "mobx-react-lite";
// import { UIIssues } from "./UIIssues";
// import { UIJobs } from "./UIJobs";
// import { UILogs } from "./UILogs";
// import { UIIssueStats } from "./UIIssueStats";
// import { UIJobStats } from "./UIJobStats";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Checkbox from "@material-ui/core/Checkbox";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import ReplayIcon from "@material-ui/icons/Replay";
import IconButton from "@material-ui/core/IconButton";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import WorkOutlineIcon from "@material-ui/icons/WorkOutline";
import SubjectIcon from "@material-ui/icons/Subject";
import LinearProgress from "@material-ui/core/LinearProgress";

import debugjs from "debug";
import { StatusIcon } from "./StatusIcon";
import { GlobalUIState, RunStatus, tabNames } from "./RunStatus";

const debugRender = debugjs("render");

const useStyles = makeStyles({
    root: {
        background: "#AAAAAA",
        padding: "16px",
        // margin: "16px"
    },
    runStatusStyles: {
        //        width: "34%",
        overflowX: "auto",
        // padding: "16px",
        // margin: "16px"
    },
    streamsStyles: {
        //        width: "66%",
        overflowX: "auto",
        // padding: "16px",
        // margin: "16px"
    },
    typographyStyles: {
        margin: "16px",
    },
    typographyStylesFooter: {
        margin: "16px",
        width: "100%",
    },
    leftMargin16px: {
        marginLeft: "16px",
    },
    gridControlTestStyle: {
        width: "1300px",
        height: "100%",
    },
    colorPrimary: {
        backgroundColor: "#ff0000",
    },
    barColorPrimary: {
        backgroundColor: "#39b370",
    },
    table: {},
});

const UIRunStatusLastRefreshTs: React.FC<{ runStatus: RunStatus; globalUIState: GlobalUIState }> = ({
    runStatus,
    globalUIState,
}) => {
    return useObserver(() => <>{runStatus.lastRefresh}</>);
};

export const colors = {
    ///////////////////////main colors/////////////////////////////////
    orange: { rgb: "rgb(241, 140, 50)", orderColor: 2 }, // error
    green: { rgb: "rgb(121, 194, 103)", orderColor: 1 }, // succed
    yellow: { rgb: "rgb(245, 214, 61)", orderColor: 0 }, // running
    ///////////////////////another colors//////////////////////////////
    pink: { rgb: "rgb(232, 104, 162)", orderColor: 4 }, // readyToRun
    salad: { rgb: "rgb(197, 214, 71)", orderColor: 5 }, // waitingDeps
    frost: { rgb: "rgb(69, 155, 168)", orderColor: 6 }, // waitingTime
    blue: { rgb: "rgb(120, 197, 214)", orderColor: 3 }, // paused
};

export const UIRunStatus: React.FC<{ runStatus: RunStatus; globalUIState: GlobalUIState }> = ({
    runStatus,
    globalUIState,
}) => {
    const classes = useStyles();
    debugRender("UIRunStatus");

    return useObserver(() => (
        <Grid container spacing={3} className={classes.root}>
            <Grid item>
                <Paper className={classes.runStatusStyles}>
                    <Typography className={classes.typographyStyles} variant="h4">
                        Статус {runStatus.instanceName}
                    </Typography>
                    <Table className={classes.table} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Параметр</TableCell>
                                <TableCell>Значение</TableCell>
                                <TableCell>Icon</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Подключение к серверу Issue Loader
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell>
                                    <StatusIcon status={runStatus.connected} />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Состояние БД Oracle
                                </TableCell>
                                <TableCell>{runStatus.globalMessages.oracle}</TableCell>
                                <TableCell>
                                    <StatusIcon status={runStatus.globalMessages.oracle} />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Состояние БД SQLite
                                </TableCell>
                                <TableCell>{runStatus.globalMessages.sqllite}</TableCell>
                                <TableCell>
                                    <StatusIcon status={runStatus.globalMessages.sqllite} />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Состояние Jira
                                </TableCell>
                                <TableCell>{runStatus.globalMessages.jira}</TableCell>
                                <TableCell>
                                    <StatusIcon status={runStatus.globalMessages.jira} />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Запросов к Jira в секунду
                                </TableCell>
                                <TableCell>{runStatus.jiraStatus.jiraRequestsPerSecond}</TableCell>
                                <TableCell>
                                    {runStatus.jiraStatus.jiraRequestsPerSecond > 20 ? (
                                        <StatusIcon status="warn" />
                                    ) : (
                                        undefined
                                    )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Количество ошибок к Jira в ответах
                                </TableCell>
                                <TableCell>{runStatus.jiraStatus.JiraResposeErrorsCount}</TableCell>
                                <TableCell>
                                    {runStatus.jiraStatus.JiraResposeErrorsCount > 1 ? (
                                        <StatusIcon status="warn" />
                                    ) : (
                                        undefined
                                    )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Среднее время отклика JIra
                                </TableCell>
                                <TableCell>{runStatus.jiraStatus.JiraResponseAverageTime}</TableCell>
                                <TableCell>
                                    {runStatus.jiraStatus.JiraResponseAverageTime > 1 ? (
                                        <StatusIcon status="warn" />
                                    ) : (
                                        undefined
                                    )}
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Последний запуск
                                </TableCell>
                                <TableCell>{runStatus.lastRun}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Время сервера Jira
                                </TableCell>
                                <TableCell>{runStatus.jiraTime}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Статус обновлен
                                </TableCell>
                                <TableCell>
                                    <UIRunStatusLastRefreshTs runStatus={runStatus} globalUIState={globalUIState} />
                                </TableCell>
                                <TableCell>
                                    <IconButton color="primary" onClick={globalUIState.requestFullRefresh}>
                                        <ReplayIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Версия
                                </TableCell>
                                <TableCell>{runStatus.versionStr}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Ресурсы Jira
                                </TableCell>
                                <TableCell component="th" scope="row">
                                    {runStatus.resurses.Jira ? parseFloat(runStatus.resurses.Jira).toFixed(2) : "?"}
                                </TableCell>
                                <TableCell>
                                    <LinearProgress
                                        variant="determinate"
                                        value={runStatus.resurses.Jira}
                                        classes={{
                                            colorPrimary: classes.colorPrimary,
                                            barColorPrimary: classes.barColorPrimary,
                                        }}
                                    />
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Ресурсы БД
                                </TableCell>
                                <TableCell component="th" scope="row">
                                    {runStatus.resurses.DB ? parseFloat(runStatus.resurses.DB).toFixed(2) : "?"}
                                </TableCell>
                                <TableCell>
                                    <LinearProgress
                                        variant="determinate"
                                        value={runStatus.resurses.DB}
                                        classes={{
                                            colorPrimary: classes.colorPrimary,
                                            barColorPrimary: classes.barColorPrimary,
                                        }}
                                    />
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell component="th" scope="row">
                                    Ресурсы CPU
                                </TableCell>
                                <TableCell component="th" scope="row">
                                    {runStatus.resurses.CPU ? parseFloat(runStatus.resurses.CPU).toFixed(2) : "?"}
                                </TableCell>
                                <TableCell>
                                    <LinearProgress
                                        variant="determinate"
                                        value={runStatus.resurses.CPU}
                                        classes={{
                                            colorPrimary: classes.colorPrimary,
                                            barColorPrimary: classes.barColorPrimary,
                                        }}
                                    />
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                    {globalUIState.statusTab === "Jobs" ? (
                        <>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        className={classes.leftMargin16px}
                                        checked={globalUIState.jobDetailsInGrid}
                                        onChange={globalUIState.toggleJobDetailsInGrid}
                                        value="checkedB"
                                        color="primary"
                                    />
                                }
                                label="Все поля Job'ов"
                            />
                        </>
                    ) : (
                        undefined
                    )}

                    {globalUIState.statusTab === "IssueStats" ? (
                        <>
                            <RadioGroup
                                defaultValue={globalUIState.issue_stats_checkProjects ? "projects" : "all"}
                                name="customized-radios"
                                className={classes.leftMargin16px}
                            >
                                <FormControlLabel
                                    value="projects"
                                    control={
                                        <Radio
                                            onChange={() => {
                                                globalUIState.issue_stats_checkAll = false;
                                                globalUIState.issue_stats_checkProjects = true;
                                            }}
                                        />
                                    }
                                    label="по проектам"
                                />
                                <FormControlLabel
                                    value="all"
                                    control={
                                        <Radio
                                            onChange={() => {
                                                globalUIState.issue_stats_checkAll = true;
                                                globalUIState.issue_stats_checkProjects = false;
                                            }}
                                        />
                                    }
                                    label="суммарно"
                                />
                            </RadioGroup>
                        </>
                    ) : (
                        undefined
                    )}

                    {globalUIState.statusTab === "JobStats" ? (
                        <>
                            <RadioGroup
                                defaultValue={globalUIState.job_stats_checkProjects ? "projects" : "all"}
                                name="customized-radios"
                                className={classes.leftMargin16px}
                            >
                                <FormControlLabel
                                    value="projects"
                                    control={
                                        <Radio
                                            onChange={() => {
                                                globalUIState.job_stats_checkAll = false;
                                                globalUIState.job_stats_checkProjects = true;
                                            }}
                                        />
                                    }
                                    label="по проектам"
                                />
                                <FormControlLabel
                                    value="all"
                                    control={
                                        <Radio
                                            onChange={() => {
                                                globalUIState.job_stats_checkAll = true;
                                                globalUIState.job_stats_checkProjects = false;
                                            }}
                                        />
                                    }
                                    label="суммарно"
                                />
                            </RadioGroup>
                        </>
                    ) : (
                        undefined
                    )}

                    <p>
                        <Typography className={classes.typographyStylesFooter} variant="caption">
                            Данные на этой странице обновляются автоматически (F5 не требуется).
                        </Typography>
                    </p>
                    <p>
                        <Typography className={classes.typographyStylesFooter} variant="caption">
                            Эти же данные в формате JSON доступны по адресу /api/runStatus.
                        </Typography>
                    </p>
                </Paper>
            </Grid>
            <Grid item className={classes.gridControlTestStyle}>
                <Paper className={classes.streamsStyles}>
                    <Tabs
                        value={globalUIState.statusTab ? tabNames.indexOf(globalUIState.statusTab!) : 0}
                        indicatorColor="primary"
                        textColor="primary"
                        onChange={globalUIState.statusTabChanged}
                        aria-label="disabled tabs example"
                    >
                        <Tab label="Issues" icon={<WorkOutlineIcon />} />
                        <Tab label="Jobs" icon={<WorkOutlineIcon />} />
                        <Tab label="Logs" icon={<SubjectIcon />} />
                        <Tab label="IssueStats" icon={<SubjectIcon />} />
                        <Tab label="JobStats" icon={<SubjectIcon />} />
                    </Tabs>

                    {'TBD'}
                </Paper>
            </Grid>
        </Grid>
    ));
};

if ((module as any).hot) {
    (module as any).hot.accept();
}

//     @observable knownErrors = [];

// <Grid item xm={6}>
// <Paper className={classes.streamsStyles}>
// <Typography className={classes.typographyStyles} variant="h4">
//     Потоки загрузки
// </Typography>
// <UILoadStreams streams={runStatus.streams} />
// </Paper>
// </Grid>
