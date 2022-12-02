import React from "react";

import "./ErrorNotification.css";

interface ErrorNotificationPropsInterface {
    text: string;
}

export default class ErrorNotification extends React.Component<ErrorNotificationPropsInterface> {
    constructor(props: ErrorNotificationPropsInterface) {
        super(props);
    }

    public render() {
        return (
            <div className="error-notification-wrapper">
                {this.props.text}
            </div>
        );
    }
}
