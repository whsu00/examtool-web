import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Toast from "react-bootstrap/Toast";
import { getToken } from "./auth";
import post from "./post";
import { timeDeltaMinutesString } from "./timeUtils";
import useInterval from "./useInterval";
import useTick from "./useTick";

export default function ExamAlerts({ exam }) {
    const [examData, setExamData] = useState(null);
    const [stale, setStale] = useState(false);

    const [audioQueue, setAudioQueue] = useState([]); // pop off the next audio to play
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);

    const [show, setShow] = useState(true);

    const time = useTick();

    useEffect(() => {
        if (audioQueue.length > 0 && !isPlayingAudio) {
            const nextAudio = audioQueue[0];
            const sound = new Audio(`data:audio/mp3;base64,${nextAudio}`);
            setIsPlayingAudio(true);
            sound.play();
            sound.addEventListener("ended", () => {
                setAudioQueue((queue) => queue.slice(1));
                setIsPlayingAudio(false);
            });
        }
    }, [audioQueue, isPlayingAudio]);

    useEffect(() => {
        (async () => {
            const resp = await post("/alerts/fetch_data", {
                token: getToken(),
                exam,
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.success) {
                    setExamData(data);
                    setStale(false);
                } else {
                    setStale(true);
                }
            } else {
                setStale(true);
            }
        })();
    }, []);

    useInterval(async () => {
        if (examData) {
            try {
                const resp = await post("/alerts/fetch_data", {
                    token: getToken(),
                    exam,
                    receivedAudio: examData.announcements.map((x) => x.id),
                });
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.success) {
                        setExamData(data);
                        setStale(false);
                        const newAudio = [];
                        for (const { audio } of data.announcements) {
                            if (audio) {
                                newAudio.push(audio);
                                setShow(true);
                            }
                        }
                        newAudio.reverse();
                        setAudioQueue((queue) => queue.concat(newAudio));
                    } else {
                        setStale(true);
                    }
                } else {
                    setStale(true);
                }
            } catch (e) {
                console.error(e);
                setStale(true);
            }
        }
    }, 10000);

    return (
        <>
            <div style={{
                position: "fixed",
                overflow: "auto",
                bottom: 80,
                right: 32,
                width: 350,
                maxHeight: "80%",
            }}
            >
                {show && examData && examData.announcements.slice().reverse().map(({
                    id, message, question, time: announcementTime,
                }) => (
                    <Toast key={id}>
                        <Toast.Header closeButton={false}>
                            <strong className="mr-auto">
                                Announcement for
                                {" "}
                                {question}
                            </strong>
                            <small>
                                {timeDeltaMinutesString(
                                    time - announcementTime,
                                )}
                            </small>
                        </Toast.Header>
                        <Toast.Body><div style={{ whiteSpace: "pre-wrap" }}>{message}</div></Toast.Body>
                    </Toast>
                ))}
            </div>
            <div style={{
                position: "fixed",
                bottom: 32,
                right: 32,
                width: 350,
            }}
            >
                <Button block onClick={() => setShow((x) => !x)} variant="outline-secondary">
                    {show ? "Hide Announcements" : "Show Announcements"}
                    {stale ? " (Offline)" : ""}
                    {examData ? "" : " (Loading...)"}
                </Button>
            </div>
        </>
    );
}
