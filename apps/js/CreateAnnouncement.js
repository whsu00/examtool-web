import React, { useState } from "react";
import { Card, Form } from "react-bootstrap";
import { getToken } from "./auth";
import FailText from "./FailText";
import LoadingButton from "./LoadingButton";
import post from "./post";

export default function CreateAnnouncement({ exam, staffData, onUpdate }) {
    const [message, setMessage] = useState("");
    const [question, setQuestion] = useState("Overall Exam");
    const [referencePoint, setReferencePoint] = useState("immediate");
    const [offset, setOffset] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [failText, setFailText] = useState("");

    const submit = async () => {
        setIsLoading(true);
        try {
            const resp = await post("add_announcement", {
                exam,
                token: getToken(),
                announcement: {
                    type: referencePoint === "immediate" ? "immediate" : "scheduled",
                    canonical_question_name: question === "Overall Exam" ? null : question,
                    base: referencePoint,
                    offset: Number.parseInt(offset, 10),
                    message,
                },
            });
            const data = await resp.json();
            if (!data.success) {
                throw Error();
            }
            onUpdate(data);
        } catch {
            setFailText(
                "Something went wrong. Reload the page to see if the announcement was broadcast",
            );
        }
        setIsLoading(false);
    };

    return (
        <Card>
            <Card.Header>
                Create Announcement
            </Card.Header>
            <Card.Body>
                <Form>
                    <Form.Group>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={message}
                            placeholder="Broadcast a message to all students in this exam."
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Control
                            as="select"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            custom
                        >
                            <option value={null}>Overall Exam</option>
                            {staffData.exam.questions.map(
                                ({ canonical_question_name: questionName }) => (
                                    <option key={questionName}>{questionName}</option>
                                ),
                            )}
                        </Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <Form.Control
                            as="select"
                            value={referencePoint}
                            onChange={(e) => setReferencePoint(e.target.value)}
                            custom
                        >
                            <option value="immediate">Immediately</option>
                            <option value="start">Relative to start</option>
                            <option value="end">Relative to end</option>
                        </Form.Control>
                    </Form.Group>
                    {referencePoint !== "immediate" && (
                        <Form.Group>
                            <Form.Control
                                type="number"
                                placeholder="Offset from reference (seconds)"
                                value={offset}
                                onChange={(e) => setOffset(e.target.value)}
                            />
                        </Form.Group>
                    )}
                    <Form.Group>
                        <LoadingButton
                            loading={isLoading}
                            disabled={isLoading || (offset == null && referencePoint !== "immediate")}
                            onClick={submit}
                        >
                            Send
                        </LoadingButton>
                        <FailText text={failText} suffixType="alerts" />
                    </Form.Group>
                </Form>
            </Card.Body>
        </Card>
    );
}
