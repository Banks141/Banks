import React, { useEffect, useState } from 'react'
import { Button, Grid, Typography, useMediaQuery } from '@material-ui/core'
import { roundDecimals } from '../../src/utils/number'
import { MarketPriceChange } from './MarketPriceChange'
import { makeStyles } from '@material-ui/core/styles'
import { Market } from '../../src/types/Market'
import gql from 'graphql-tag'
import BarChartIcon from '@material-ui/icons/BarChart'
import AttachMoneyIcon from '@material-ui/icons/AttachMoney'
import VisibilityIcon from '@material-ui/icons/Visibility'
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff'
import theme from '../../src/theme'
import { getPartnerLink } from '../../src/utils/partner'
import { useMutation } from '@apollo/react-hooks'
import { DataProxy } from 'apollo-cache'
import Router from 'next/router'

const useStyles = makeStyles(theme => ({
  priceChange: {
    marginLeft: theme.spacing(1)
  },
  analysisButton: {
    textAlign: 'right',
    marginBottom: theme.spacing(2),
    '& a:hover': {
      textDecoration: 'none',
    },
  },
  investButton: {
    textAlign: 'right',
    '& a:hover': {
      textDecoration: 'none',
    },
  },
  followCount: {
    margin: theme.spacing(1, 0, 0, 0),
    display: 'block',
    [theme.breakpoints.up('sm')]: {
      margin: theme.spacing(0, 0, 0, 1),
      display: 'inline',
    },
  },
}))

const FOLLOW_MARKET_MUTATION = gql`
  mutation ($marketId: ID!) {
    createMarketFollow (input: { market: $marketId }) {
      marketFollow {
        id
      }
    }
  }
`

const UNFOLLOW_MARKET_MUTATION = gql`
  mutation ($followId: ID!) {
    deleteMarketFollow (input: {id: $followId}) {
      result
    }
  }
`

interface Props {
  market: Market
  viewerId: string | undefined
}

export const MarketHeader = (props: Props) => {
  const classes = useStyles()
  const { market, viewerId } = props
  const [followMarket] = useMutation(FOLLOW_MARKET_MUTATION)
  const [unfollowMarket] = useMutation(UNFOLLOW_MARKET_MUTATION)
  const xsDown = useMediaQuery(theme.breakpoints.down('sm'))
  const [viewerFollowId, setViewerFollowId] = useState(market.viewerFollow?.id || null)

  useEffect(() => {
    setViewerFollowId(market.viewerFollow?.id || null)
  }, [market])

  const updateNumberOfFollowers = (proxy: DataProxy, numberOfFollowers: number) => {
    proxy.writeFragment({
      id: market.symbol,
      fragment: gql`
        fragment MarketFollowers on Market {
          numberOfFollowers
        }
      `,
      data: {
        numberOfFollowers,
      },
    })
  }

  const handleFollowClick = async () => {
    if (!viewerId) {
      await Router.push('/register')
      return
    }

    const res = await followMarket({
      variables: {
        marketId: market.id
      },
      update: (proxy) => updateNumberOfFollowers(proxy, market.numberOfFollowers + 1),
    })
    setViewerFollowId(res.data.createMarketFollow.marketFollow.id)
  }

  const handleUnfollowClick = async () => {
    await unfollowMarket({
      variables: {
        followId: viewerFollowId
      },
      update: (proxy) => updateNumberOfFollowers(proxy, market.numberOfFollowers - 1),
    })
    setViewerFollowId(null)
  }

  return (
    <Grid container>
      <Grid item xs={6}>
        <Typography gutterBottom variant="subtitle1" component="h1">
          {market.symbol.toUpperCase()} - {market.fullName}
        </Typography>
        <Typography gutterBottom variant={xsDown ? 'h5' : 'h4'}>
          {
            market.price && `$${roundDecimals(market.price, 2)}`
          }
          <span className={classes.priceChange}>
            {
              market.price && market.priceClose && <MarketPriceChange market={market} variant="h6" component="span"/>
            }
          </span>
        </Typography>
        {
          viewerFollowId ? (
            <Button variant="contained" color="secondary" startIcon={<VisibilityOffIcon/>}
                    onClick={handleUnfollowClick}>
              Unfollow
            </Button>
          ) : (
            <Button variant="contained" color="primary" startIcon={<VisibilityIcon/>}
                    onClick={handleFollowClick}>
              Follow
            </Button>
          )
        }
        {
          !xsDown && market.numberOfFollowers ? (
            <div className={classes.followCount}>
              {market.numberOfFollowers} followers
            </div>
          ) : ''
        }
      </Grid>
      <Grid item xs={6}>
        {
          market.icId && (
            <div className={classes.analysisButton}>
              <a href={`http://inspectcompany.com/${market.icId}`}>
                <Button variant="contained" color="default" startIcon={!xsDown && <BarChartIcon/>}>
                  Company analysis
                </Button>
              </a>
            </div>
          )
        }
        {
          market.partnerId && (
            <div className={classes.investButton}>
              <a href={getPartnerLink(market.partnerId)} target="_blank" rel="nofollow noopener noreferrer">
                <Button variant="contained" color="default" startIcon={<AttachMoneyIcon/>}>
                  Invest on {market.partnerId.toUpperCase()}
                </Button>
              </a>
            </div>
          )
        }
      </Grid>
    </Grid>
  )
}

MarketHeader.fragments = {
  market: gql`
    fragment MarketHeader on Market {
      id
      symbol
      fullName
      price
      priceClose
      icId
      partnerId
      numberOfFollowers
      viewerFollow {
        id
      }
    }
  `
}
