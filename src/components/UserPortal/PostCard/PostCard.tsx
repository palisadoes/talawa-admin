/**
 * Component representing a post card in the user portal.
 *
 * This component displays a post with its details such as title, content, creator,
 * likes, comments, and associated actions like editing, deleting, liking, and commenting.
 * It also includes modals for viewing the post in detail and editing the post content.
 *
 * @param props - The properties of the post card.
 * @param props.id - Unique identifier for the post.
 * @param props.creator - Object containing the creator's details (id, firstName, lastName, email).
 * @param props.title - Title of the post.
 * @param props.text - Content of the post.
 * @param props.image - URL of the post's image.
 * @param props.postedAt - Date when the post was created.
 * @param props.likeCount - Number of likes on the post.
 * @param props.likedBy - Array of users who liked the post.
 * @param props.comments - Array of comments on the post.
 * @param props.commentCount - Total number of comments on the post.
 * @param props.fetchPosts - Function to refresh the list of posts.
 *
 * @returns A JSX.Element representing the post card.
 *
 * @remarks
 * - Includes GraphQL mutations for liking, unliking, commenting, editing, and deleting posts.
 * - Uses `react-bootstrap` for UI components and `@apollo/client` for GraphQL operations.
 * - Handles state for likes, comments, and modals using React hooks.
 * - Displays error messages and success notifications using `react-toastify`.
 */
import React from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  Col,
  Button,
  Card,
  Dropdown,
  Form,
  InputGroup,
  Modal,
  ModalFooter,
} from 'react-bootstrap';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CommentIcon from '@mui/icons-material/Comment';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import type { InterfacePostCard } from 'utils/interfaces';
import {
  CREATE_COMMENT_POST,
  DELETE_POST_MUTATION,
  LIKE_POST,
  UNLIKE_POST,
  UPDATE_POST_MUTATION,
} from 'GraphQl/Mutations/mutations';
import CommentCard from '../CommentCard/CommentCard';
import { errorHandler } from 'utils/errorHandler';
import useLocalStorage from 'utils/useLocalstorage';
import styles from '../../../style/app-fixed.module.css';
import UserDefault from '../../../assets/images/defaultImg.png';

interface InterfaceCommentCardProps {
  id: string;
  creator: { id: string; firstName: string; lastName: string; email: string };
  likeCount: number;
  likedBy: { id: string }[];
  text: string;
  handleLikeComment: (commentId: string) => void;
  handleDislikeComment: (commentId: string) => void;
}

export default function postCard(props: InterfacePostCard): JSX.Element {
  const { t } = useTranslation('translation', { keyPrefix: 'postCard' });
  const { t: tCommon } = useTranslation('common');

  const { getItem } = useLocalStorage();

  // Retrieve user ID from local storage
  const userId = getItem('userId') as string;
  // Check if the post is liked by the current user
  const likedByUser = props.likedBy.some((likedBy) => likedBy.id === userId);

  // State variables
  const [comments, setComments] = React.useState(props.comments);
  const [numComments, setNumComments] = React.useState(props.commentCount);

  const [likes, setLikes] = React.useState(props.likeCount);
  const [isLikedByUser, setIsLikedByUser] = React.useState(likedByUser);
  const [commentInput, setCommentInput] = React.useState('');
  const [viewPost, setViewPost] = React.useState(false);
  const [showEditPost, setShowEditPost] = React.useState(false);
  const [postContent, setPostContent] = React.useState<string>(props.text);

  // Post creator's full name
  const postCreator = `${props.creator.firstName} ${props.creator.lastName}`;

  // GraphQL mutations
  const [likePost, { loading: likeLoading }] = useMutation(LIKE_POST);
  const [unLikePost, { loading: unlikeLoading }] = useMutation(UNLIKE_POST);
  const [create, { loading: commentLoading }] =
    useMutation(CREATE_COMMENT_POST);
  const [editPost] = useMutation(UPDATE_POST_MUTATION);
  const [deletePost] = useMutation(DELETE_POST_MUTATION);

  // Toggle the view post modal
  const toggleViewPost = (): void => setViewPost(!viewPost);

  // Toggle the edit post modal
  const toggleEditPost = (): void => setShowEditPost(!showEditPost);

  // Handle input changes for the post content
  const handlePostInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPostContent(e.target.value);
  };

  // Toggle like or unlike the post
  const handleToggleLike = async (): Promise<void> => {
    if (isLikedByUser) {
      try {
        const { data } = await unLikePost({ variables: { postId: props.id } });

        if (data) {
          setLikes((likes) => likes - 1);
          setIsLikedByUser(false);
        }
      } catch (error: unknown) {
        toast.error(error as string);
      }
    } else {
      try {
        const { data } = await likePost({ variables: { postId: props.id } });

        if (data) {
          setLikes((likes) => likes + 1);
          setIsLikedByUser(true);
        }
      } catch (error: unknown) {
        toast.error(error as string);
      }
    }
  };

  // Handle changes to the comment input field
  const handleCommentInput = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const comment = event.target.value;
    setCommentInput(comment);
  };

  // Dislike a comment
  const handleDislikeComment = (commentId: string): void => {
    const updatedComments = comments.map((comment) => {
      let updatedComment = { ...comment };
      if (
        comment.id === commentId &&
        comment.likedBy.some((user) => user.id === userId)
      ) {
        updatedComment = {
          ...comment,
          likedBy: comment.likedBy.filter((user) => user.id !== userId),
          likeCount: comment.likeCount - 1,
        };
      }
      return updatedComment;
    });
    setComments(updatedComments);
  };

  // Like a comment
  const handleLikeComment = (commentId: string): void => {
    const updatedComments = comments.map((comment) => {
      let updatedComment = { ...comment };
      if (
        comment.id === commentId &&
        !comment.likedBy.some((user) => user.id === userId)
      ) {
        updatedComment = {
          ...comment,
          likedBy: [...comment.likedBy, { id: userId as string }],
          likeCount: comment.likeCount + 1,
        };
      }
      return updatedComment;
    });
    setComments(updatedComments);
  };

  // Create a new comment
  const createComment = async (): Promise<void> => {
    try {
      // Ensure the input is not empty
      if (!commentInput.trim()) {
        toast.error(t('emptyCommentError'));
        return;
      }

      const { data: createEventData } = await create({
        variables: { postId: props.id, comment: commentInput },
      });

      if (createEventData) {
        setCommentInput('');
        setNumComments((numComments) => numComments + 1);

        const newComment: InterfaceCommentCardProps = {
          id: createEventData.createComment.id,
          creator: {
            id: createEventData.createComment.creator._id,
            firstName: createEventData.createComment.creator.firstName,
            lastName: createEventData.createComment.creator.lastName,
            email: createEventData.createComment.creator.email,
          },
          likeCount: createEventData.createComment.likeCount,
          likedBy: createEventData.createComment.likedBy,
          text: createEventData.createComment.text,
          handleLikeComment: handleLikeComment,
          handleDislikeComment: handleDislikeComment,
        };

        setComments([...comments, newComment]);
      }
    } catch (error: unknown) {
      // Handle errors
      // Log error with context for debugging
      console.error('Error creating comment:', error);

      // Show user-friendly translated message based on error type
      if (error instanceof Error) {
        const isValidationError = error.message.includes(
          'Comment validation failed',
        );
        toast.error(
          isValidationError ? t('emptyCommentError') : t('unexpectedError'),
        );
      } else {
        toast.error(t('unexpectedError'));
      }
    }
  };

  // Edit the post
  const handleEditPost = async (): Promise<void> => {
    try {
      const { data: createEventData } = await editPost({
        variables: { id: props.id, text: postContent },
      });

      if (createEventData) {
        props.fetchPosts(); // Refresh the posts
        toggleEditPost();
        toast.success(
          tCommon('updatedSuccessfully', { item: 'Post' }) as string,
        );
      }
    } catch (error: unknown) {
      errorHandler(t, error);
    }
  };

  // Delete the post
  const handleDeletePost = async (): Promise<void> => {
    try {
      const { data: createEventData } = await deletePost({
        variables: { id: props.id },
      });

      if (createEventData) {
        props.fetchPosts(); // Refresh the posts
        toast.success('Successfully deleted the Post.');
      }
    } catch (error: unknown) {
      errorHandler(t, error);
    }
  };

  return (
    <Col key={props.id} className="d-flex justify-content-center my-2">
      <Card className={`${styles.cardStyles}`}>
        <Card.Header className={`${styles.cardHeaderPostCard}`}>
          <div className={`${styles.creator}`}>
            <AccountCircleIcon className="my-2" />
            <p>{postCreator}</p>
          </div>
          <Dropdown style={{ cursor: 'pointer' }}>
            <Dropdown.Toggle
              className={styles.customToggle}
              data-testid={'dropdown'}
            >
              <MoreVertIcon />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={toggleEditPost} data-testid={'editPost'}>
                <EditOutlinedIcon
                  style={{ color: 'grey', marginRight: '8px' }}
                />
                {tCommon('edit')}
              </Dropdown.Item>
              <Dropdown.Item
                onClick={handleDeletePost}
                data-testid={'deletePost'}
              >
                <DeleteOutlineOutlinedIcon
                  style={{ color: 'red', marginRight: '8px' }}
                />
                {tCommon('delete')}
              </Dropdown.Item>
              {/* <Dropdown.Item href="#/action-3">Pin Post</Dropdown.Item>
              <Dropdown.Item href="#/action-3">Report</Dropdown.Item>
              <Dropdown.Item href="#/action-3">Share</Dropdown.Item> */}
            </Dropdown.Menu>
          </Dropdown>
        </Card.Header>
        <Card.Img
          className={styles.postImage}
          variant="top"
          src={
            props.image === '' || props.image === null
              ? UserDefault
              : props.image
          }
        />
        <Card.Body className="pb-0">
          <Card.Title className={`${styles.cardTitlePostCard}`}>
            {props.title}
          </Card.Title>
          <Card.Subtitle style={{ color: '#808080' }}>
            {t('postedOn', { date: props.postedAt })}
          </Card.Subtitle>
          <Card.Text className={`${styles.cardText} mt-4`}>
            {props.text}
          </Card.Text>
        </Card.Body>
        <Card.Footer style={{ border: 'none', background: 'white' }}>
          <div className={`${styles.cardActions}`}>
            <Button
              size="sm"
              className={`px-4 ${styles.addButton}`}
              data-testid={'viewPostBtn'}
              onClick={toggleViewPost}
            >
              {t('viewPost')}
            </Button>
          </div>
        </Card.Footer>
      </Card>
      <Modal show={viewPost} onHide={toggleViewPost} size="xl" centered>
        <Modal.Body className="d-flex w-100 p-0" style={{ minHeight: '80vh' }}>
          <div className="w-50 d-flex  align-items-center justify-content-center">
            <img
              src={
                props.image === '' || props.image === null
                  ? UserDefault
                  : props.image
              }
              alt="postImg"
              className="w-100"
            />
          </div>
          <div className="w-50 p-2 position-relative">
            <div className="d-flex justify-content-between align-items-center">
              <div className={`${styles.cardHeaderPostCard} p-0`}>
                <AccountCircleIcon className="my-2" />
                <p>{postCreator}</p>
              </div>
              <div style={{ cursor: 'pointer' }}>
                <MoreVertIcon />
              </div>
            </div>
            <div className="mt-2">
              <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {props.title}
              </p>
              <p>{props.text}</p>
            </div>
            <h4>Comments</h4>
            <div className={styles.commentContainer}>
              {numComments ? (
                comments.map((comment, index: number) => {
                  const cardProps: InterfaceCommentCardProps = {
                    id: comment.id,
                    creator: {
                      id: comment.creator.id,
                      firstName: comment.creator.firstName,
                      lastName: comment.creator.lastName,
                      email: comment.creator.email,
                    },
                    likeCount: comment.likeCount,
                    likedBy: comment.likedBy,
                    text: comment.text,
                    handleLikeComment: handleLikeComment,
                    handleDislikeComment: handleDislikeComment,
                  };
                  return <CommentCard key={index} {...cardProps} />;
                })
              ) : (
                <p>No comments to show.</p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <div className={`${styles.modalActions}`}>
                <div className="d-flex align-items-center gap-2">
                  <Button
                    className={`${styles.cardActionBtn}`}
                    onClick={handleToggleLike}
                    data-testid={'likePostBtn'}
                  >
                    {likeLoading || unlikeLoading ? (
                      <HourglassBottomIcon fontSize="small" />
                    ) : isLikedByUser ? (
                      <ThumbUpIcon fontSize="small" />
                    ) : (
                      <ThumbUpOffAltIcon fontSize="small" />
                    )}
                  </Button>
                  {likes}
                  {` ${t('likes')}`}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Button className={`${styles.cardActionBtn}`}>
                    <CommentIcon fontSize="small" />
                  </Button>
                  {numComments}
                  {` ${t('comments')}`}
                </div>
              </div>
              <InputGroup className="mt-2">
                <Form.Control
                  placeholder={'Enter comment'}
                  type="text"
                  className={styles.inputArea}
                  value={commentInput}
                  onChange={handleCommentInput}
                  data-testid="commentInput"
                />
                <InputGroup.Text
                  className={`${styles.colorPrimary} ${styles.borderNone}`}
                  onClick={createComment}
                  data-testid="createCommentBtn"
                >
                  {commentLoading ? (
                    <HourglassBottomIcon fontSize="small" />
                  ) : (
                    <SendIcon />
                  )}
                </InputGroup.Text>
              </InputGroup>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      <Modal show={showEditPost} onHide={toggleEditPost} size="lg" centered>
        <Modal.Header closeButton className={`py-2`}>
          <p className="fs-3" data-testid={'editPostModalTitle'}>
            {t('editPost')}
          </p>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="text"
            as="textarea"
            rows={3}
            className={styles.postInput}
            data-testid="postInput"
            autoComplete="off"
            required
            onChange={handlePostInput}
            value={postContent}
          />
        </Modal.Body>
        <ModalFooter>
          <Button
            size="sm"
            className={`px-4 ${styles.addButton}`}
            data-testid={'editPostBtn'}
            onClick={handleEditPost}
          >
            {t('editPost')}
          </Button>
        </ModalFooter>
      </Modal>
    </Col>
  );
}
