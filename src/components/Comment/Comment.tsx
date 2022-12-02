import React from "react";

import "./Comment.css";
import Like from "../Like/Like";
import moment from "moment/moment";
import "moment/locale/ru";

moment.locale("ru");

export interface AuthorInterface {
    id: number;
    name: string;
    avatar: string;
}

export interface CommentInterface {
    id: number;
    created: string;
    text: string;
    author: AuthorInterface | undefined;
    children: Array<CommentInterface>;
    likes: number;
    key?: string;
}

interface CommentComponentPropsInterface {
    data: CommentInterface;
    updateLikesCount: (commentId: number, likes: number) => void;
}

export default class CommentComponent extends React.Component<
    CommentComponentPropsInterface,
    CommentInterface
> {
    constructor(props: any) {
        super(props);

        this.state = {
            ...props.data,
        };

        this.increaseCount = this.increaseCount.bind(this);
        this.decreaseCount = this.decreaseCount.bind(this);
    }

    private increaseCount(): void {
        this.setState((state) => ({
            likes: state.likes + 1,
        }), () => {
            this.updateLikesCount();
        });
    }

    private decreaseCount(): void {
        this.setState((state) => ({
            likes: state.likes - 1,
        }), () => {
            this.updateLikesCount();
        });
    }

    private updateLikesCount(): void {
        if (this.props.updateLikesCount) {
            this.props.updateLikesCount(this.state.id, this.state.likes);
        }
    }

    public render() {
        const avatarBackgroundUrl = `url(${this.state.author.avatar})`;
        const createdDate = moment(this.state.created).fromNow();

        return (
            <div className="comment-item">
                <div className="comment-avatar">
                    <div className="comment-avatar__wrapper">
                        <div
                            className="comment-avatar__img"
                            style={{backgroundImage: avatarBackgroundUrl}}
                        ></div>
                    </div>
                </div>

                <div className="comment-inner">
                    <div className="comment-inner__header">
                        <div className="comment-user">
                            <div className="comment-user__nickname">
                                {this.state.author.name}
                            </div>

                            <div className="comment-user__last-seen">
                                {createdDate}
                            </div>
                        </div>

                        <div className="comment-like">
                            <Like count={this.state.likes} increase={this.increaseCount} decrease={this.decreaseCount} />
                        </div>
                    </div>

                    <div className="comment-inner__message">
                        {this.state.text}
                    </div>
                </div>
            </div>
        );
    }
}
