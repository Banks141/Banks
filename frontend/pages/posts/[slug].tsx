import React, { useEffect, useState } from 'react'
import { Post } from '../../src/types/Post'
import { Comment } from '../../src/types/Comment'
import { Box, Card, CardContent, CircularProgress, Divider, Grid, Typography } from '@material-ui/core'
import { Layout } from '../../components/PageLayout/Layout'
import { MarkdownContent } from '../../components/MarkdownContent'
import { CommentForm } from '../../components/comments/CommentForm'
import Link from 'next/link'
import Error from 'next/error'
import Head from 'next/head'
import { withApollo } from '../../src/apollo'
import gql from 'graphql-tag'
import { useQuery } from '@apollo/react-hooks'
import { NextPageContext } from 'next'
import { AuthService } from '../../src/services/AuthService'
import { PostVotes } from '../../components/posts/PostVotes'
import { PostActions } from '../../components/posts/PostActions'
import { CommentList } from '../../components/comments/CommentList'
import { PostHeader } from '../../components/posts/PostHeader'
import { getPlainText } from '../../src/utils/markdown'
import { parseUrl } from '../../src/utils/string'
import { MarketHeader } from '../../components/markets/MarketHeader'

interface Props {
  slug: string
  viewerId: string | undefined
}

const POST_QUERY = gql`
  query Post ($slug: String!) {
    post (slug: $slug) {
      id
      title
      slug
      body
      lgImageUrl
      ...PostVotes
      ...PostActions
      ...PostHeader
      market {
        ...MarketHeader
      }
    }
  }
  ${PostVotes.fragments.post}
  ${PostActions.fragments.post}
  ${PostHeader.fragments.post}
  ${MarketHeader.fragments.market}
`

function PostPage (props: Props) {
  const { loading, error, data } = useQuery(
    POST_QUERY,
    {
      variables: {
        slug: props.slug
      },
      notifyOnNetworkStatusChange: true,
    }
  )
  const { viewerId } = props
  const [post, setPost] = useState<Post>(data?.post)
  const [lastCommentAddedId, setLastCommentAddedId] = useState('')

  useEffect(() => {
    setPost(data?.post)
  }, [data])

  if (error) {
    return <Error title={error.message} statusCode={404}/>
  }

  if (loading || !post) {
    return <CircularProgress/>
  }

  const handleCommentAdded = (comment: Comment) => {
    setLastCommentAddedId(comment.id)
  }

  const postFullUrl = `https://finsharing.com/posts/${post.slug}`
  const postDescription = getPlainText(post.body)
  const postImage = parseUrl(post.lgImageUrl)
  let shortDescription = postDescription.slice(0, 300).trim()
  if (postDescription.length > shortDescription.length) {
    shortDescription += '...'
  }

  return (
    <Layout>
      <Head>
        <title>{post.title} - FinSharing.com</title>
        <meta name="description" content={shortDescription}/>
        <meta property="og:title" content={post.title}/>
        <meta property="og:url" content={postFullUrl}/>
        <meta name="twitter:title" content={post.title}/>
        <meta name="twitter:description" content={shortDescription}/>
        <link rel="canonical" href={postFullUrl}/>
        {
          postImage && (
            <>
              <meta property="og:image" content={postImage}/>
              <meta name="twitter:image" content={postImage}/>
            </>
          )
        }
      </Head>

      <MarketHeader market={post.market}/>

      <Card>
        <Grid container>
          <Grid item xs={2} sm={1}>
            <PostVotes post={post} viewerId={viewerId}/>
          </Grid>
          <Grid item xs={10} sm={11}>
            <CardContent>
              <PostHeader post={post}/>

              <Typography gutterBottom variant="h5" component="h2">
                {post.title}
              </Typography>
              <MarkdownContent content={post.body}/>
            </CardContent>

            <Divider variant="middle"/>

            <PostActions post={post} authUserId={viewerId}/>
          </Grid>
        </Grid>
      </Card>

      <Box mt={2}>
        <Card>
          {
            viewerId ?
              <CommentForm post={post} onCommentAdd={handleCommentAdded}/> :
              <CardContent>You need <Link href="/register"><a>a free account</a></Link> to comment.</CardContent>
          }
        </Card>
      </Box>

      <Box mt={2}>
        <CommentList post={post}
                     authUserId={viewerId}
                     lastCommentAddedId={lastCommentAddedId}/>
      </Box>


    </Layout>
  )
}

PostPage.getInitialProps = async (ctx: NextPageContext): Promise<Props> => {
  const slug = (Array.isArray(ctx.query.slug) ? ctx.query.slug[0] : ctx.query.slug).toLowerCase()
  return {
    viewerId: new AuthService(ctx).getViewer()?.id,
    slug,
  }
}

export default withApollo(PostPage)
