import React from "react";

import Like from "../Like/Like";
import CommentComponent, {
    AuthorInterface,
    CommentInterface,
} from "../Comment/Comment";
import ErrorNotification from "../ErrorNotification/ErrorNotification";

import "./Chat.css";
import getAuthorsRequest from "../../api/authors/getAuthorsRequest";
import getCommentsRequest from "../../api/comments/getCommentsRequest";

interface ChatComponentStateInterface {
    page: number;
    authors: Array<AuthorInterface>;
    comments: Array<CommentInterface>;
    nextPageLoading: boolean;
    initialLoading: boolean;
    allItemsLoaded: boolean;
    showError: boolean;
    totalLikesCount: number;
    totalCommentsCount: number;
}

interface CommentsFromServerInterface {
    pagination: {
        page: number;
        total_pages: number;
    };
    data: Array<CommentDataFromServerInterface>;
}

interface CommentDataFromServerInterface {
    id: number;
    created: string;
    text: string;
    author: number;
    parent: number;
    likes: number;
}

export default class ChatComponent extends React.Component<
    {},
    ChatComponentStateInterface
> {
    private mounted = false;

    constructor(props: any) {
        super(props);

        this.state = {
            authors: [],
            comments: [],
            page: 1,
            nextPageLoading: false,
            initialLoading: true,
            allItemsLoaded: false,
            showError: false,
            totalLikesCount: 0,
            totalCommentsCount: 0,
        };

        this.nextPage = this.nextPage.bind(this);
        this.updateLikesCount = this.updateLikesCount.bind(this);
    }

    public componentDidMount() {
        if (this.mounted) {
            return;
        }

        this.mounted = true;

        this.initAuthors();
    }

    private initAuthors() {
        getAuthorsRequest()
            .then((result) => {
                this.setState(() => ({
                    authors: result,
                }));
            })
            .then(() => this.loadComments());
    }

    private loadComments() {
        const nextPage = this.state.initialLoading
            ? this.state.page
            : this.state.page + 1;

        getCommentsRequest(nextPage)
            .then((result: CommentsFromServerInterface) => {
                this.setState((state) => {
                    const updatedComments = [
                        ...state.comments,
                        ...this.modifyCommentsFromServer(result.data),
                    ];

                    return {
                        comments: updatedComments,
                        page: result.pagination.page,
                        nextPageLoading: false,
                        initialLoading: false,
                        showError: false,
                        allItemsLoaded:
                            result.pagination.total_pages ===
                            result.pagination.page,
                        totalLikesCount: this.calculateTotalLikesCount(updatedComments),
                        totalCommentsCount: this.calculateTotalComments(updatedComments),
                    };
                });
            })
            .catch(() => {
                this.setState(() => ({
                    nextPageLoading: false,
                    initialLoading: false,
                    showError: true,
                }));

                setTimeout(() => {
                    this.setState(() => ({
                        showError: false,
                    }));
                }, 5000);
            });
    }

    private nextPage(): void {
        if (this.state.nextPageLoading) {
            return;
        }

        this.setState(() => ({
            nextPageLoading: true,
        }));

        this.loadComments();
    }

    private modifyCommentsFromServer(
        commentsFromServer: Array<CommentDataFromServerInterface>,
    ): Array<CommentInterface> {
        const makeTree = (
            items: Array<CommentDataFromServerInterface>,
            id: number | null = null,
        ) =>
            items
                .filter((item) => item.parent === id)
                .map((item) => {
                    const author = this.state.authors.find(
                        (author) => author.id === item.author,
                    );

                    return {
                        ...item,
                        author: author,
                        children: makeTree(items, item.id),
                    };
                });

        const extractChildren = (items: Array<CommentInterface>) => {
            const result = [];

            items.forEach((item) => {
                if (!item.children || !item.children.length) {
                    result.push(item);

                    return;
                }

                const toArray = (nodes: any[], arr: any[]) => {
                    if (!nodes) {
                        return [];
                    }
                    if (!arr) {
                        arr = [];
                    }
                    for (var i = 0; i < nodes.length; i++) {
                        arr.push(nodes[i]);
                        toArray(nodes[i].children, arr);
                    }
                    return arr;
                }

                const childrenList = [ ...item.children ];
                const newChildrenList = toArray(childrenList, []);

                item.children = newChildrenList;

                result.push(item);
            });

            return result;
        };

        return extractChildren(makeTree(commentsFromServer));
    }

    private updateLikesCount(commentId: number, likes: number): void {
        this.setState((state) => {
            const newCommentsState = [ ...state.comments ];

            const checkCommentLikes = (comments) => {
                const newComments = comments;

                comments.forEach((comment) => {
                    if (comment.id === commentId) {
                        comment.likes = likes;
                    }

                    if (comment.children && comment.children.length) {
                        checkCommentLikes(comment.children);
                    }
                });

                return newComments;
            };

            const result = checkCommentLikes(newCommentsState);

            return {
                comments: result,
                totalLikesCount: this.calculateTotalLikesCount(result),
            };
        });
    }

    private calculateTotalLikesCount(comments: Array<CommentInterface>): number {
        return comments
            .reduce(
                (acc, comment) => {
                    return comment.children && comment.children.length
                        ? comment.children.reduce((a, c) => a + c.likes, 0) + acc + comment.likes
                        : acc + comment.likes;
                },
                0
            );
    }

    private calculateTotalComments(comments: Array<CommentInterface>): number {
        return comments
            .reduce(
                (acc, comment) => {
                    return comment.children && comment.children.length
                        ? comment.children.reduce((a, c) => a + 1, 0) + acc + 1
                        : acc + 1;
                },
                0
            );
    }

    public render() {
        const nextPageLoading = this.state.nextPageLoading;
        const commentsData = this.state.comments;
        const commentTemplateList: Array<any> = [];
        const allItemsLoaded = this.state.allItemsLoaded;

        const errorNotificationTemplate = this.state.showError
            ? <ErrorNotification text={'При загрузке комментариев произошла ошибка. Попробуйте снова.'} />
            : '';

        commentsData.forEach((comment) => {
            const children = comment.children;
            const childrenTemplateList: Array<any> = [];

            children.forEach((childrenItem) => {
                childrenTemplateList.push(
                    <CommentComponent
                        data={childrenItem}
                        updateLikesCount={this.updateLikesCount}
                        key={childrenItem.id.toString()}
                    />,
                );
            });

            const commentTemplate = (
                <div
                    key={comment.id.toString()}
                    className="comments__list-item"
                >
                    <CommentComponent data={comment} updateLikesCount={this.updateLikesCount} />

                    {childrenTemplateList.length ? (
                        <div className="comments__list-children">
                            {childrenTemplateList}
                        </div>
                    ) : (
                        ""
                    )}
                </div>
            );

            commentTemplateList.push(commentTemplate);
        });

        const loadMoreButtonClass = nextPageLoading
            ? "comments__load-more comments__load-more--disabled"
            : "comments__load-more";
        const loadMoreButtonText = nextPageLoading
            ? "Загрузка"
            : "Загрузить еще";
        const loadMoreButtonTemplate = !allItemsLoaded ? (
            <button className={loadMoreButtonClass} onClick={this.nextPage}>
                {loadMoreButtonText}
            </button>
        ) : (
            ""
        );
        const chatTemplate = (
            <div className="comments">
                <div className="comments__header">
                    <div className="comments__header-count">
                        {this.state.totalCommentsCount} коментариев
                    </div>

                    <div className="comments__header-likes">
                        <Like disabled={true} count={this.state.totalLikesCount}></Like>
                    </div>
                </div>

                <div className="comments__list">
                    {commentTemplateList}
                </div>

                {loadMoreButtonTemplate}
            </div>
        );

        const loadingTemplate = (
            <div className="initial-loader">
                <div className="initial-loader__spinner"></div>
            </div>
        );

        return (
            <div className="App">
                {this.state.initialLoading ? loadingTemplate : chatTemplate}

                {errorNotificationTemplate}
            </div>
        );
    }
}
