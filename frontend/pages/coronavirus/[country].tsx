import * as React from 'react'
import Head from 'next/head'
import { Layout } from '../../components/PageLayout/Layout'
import { withApollo } from '../../src/apollo'
import { RedisClient } from '../../src/clients/redis'
import { Box, Card, CardContent, Divider, Grid } from '@material-ui/core'
import Typography from '@material-ui/core/Typography'
import { countries, Country } from 'countries-list'
import { makeStyles } from '@material-ui/styles'
import { NextPageContext } from 'next'
import Error from 'next/error'
import LinearChart from '../../components/charts/LinearChart'
import moment from 'moment'
import { Alert } from '@material-ui/lab'

const useStyles = makeStyles({})

interface Props {
  country?: Country
  countryKey: string
  cases: { [key: string]: number }
  deaths: { [key: string]: number }
  travelRestrictions?: string
}

function CountryCoronavirus (props: Props) {
  const classes = useStyles()
  const { country, countryKey, cases, deaths, travelRestrictions } = props

  if (!country) {
    return <Error statusCode={404} message={'Country not found'}/>
  }

  const dailyCases = Object.entries(cases)
    .filter(([key]) => key.startsWith(`${countryKey}_`) && /_\d{13}$/.test(key))
    .sort((a, b) => a[0] > b[0] ? 1 : -1)
  const dailyDeaths = Object.entries(deaths)
    .filter(([key]) => key.startsWith(`${countryKey}_`) && /_\d{13}$/.test(key))
    .sort((a, b) => a[0] > b[0] ? 1 : -1)

  const dataDates: string[] = []
  const dailyCasesValues: number[] = []
  const dailyDeathsValues: number[] = []

  if (dailyCases.length) {
    let itDate = Number(dailyCases[0][0].replace(/.+_(\d{13})$/, '$1'))
    while (itDate < Date.now()) {
      const itCases = dailyCases.find(([key]) => key.endsWith(itDate.toString()))
      const itDeaths = dailyDeaths.find(([key]) => key.endsWith(itDate.toString()))
      dataDates.push(moment(new Date(itDate)).utc().format('D MMM \'YY'))
      dailyCasesValues.push(itCases ? itCases[1] : 0)
      dailyDeathsValues.push(itDeaths ? itDeaths[1] : 0)
      itDate += 1000 * 60 * 60 * 24
    }
  }

  if (!dailyCasesValues[dailyCasesValues.length - 1]) {
    dailyCasesValues.pop()
    dailyDeathsValues.pop()
    dataDates.pop()
  }

  function renderProgressComparison () {
    if (dailyCasesValues.length < 10) {
      return <></>
    }
    const current = dailyCasesValues.slice(-5).reduce((prev, curr) => prev + curr, 0)
    const previous = dailyCasesValues.slice(-10, -5).reduce((prev, curr) => prev + curr, 0)
    return (
      <Box mt={3}>
        <Alert severity={current > previous ? 'error' : 'info'}>
          During the last 5 days, {country!.name} reported&nbsp;
          <strong style={{ display: 'contents' }}>
            {
              current === previous ?
                'the same number of cases' :
                `${Math.abs(current - previous).toLocaleString()} ${current > previous ? 'more' : 'fewer'} cases`
            }&nbsp;
          </strong>
          than during the previous 5 days.
        </Alert>
      </Box>
    )
  }

  const title = `Coronavirus cases in ${country.name} ${country.emoji}`
  const description = `Statistics of coronavirus cases in ${country.name}. Daily chart of covid-19 cases reported in ${country.name}.`
  const url = `https://finsharing.com/coronavirus/${countryKey}`

  return (
    <Layout>
      <Head>
        <title>{title}</title>
        <meta name="description"
              content={description}/>
        <meta property="og:title" content={title}/>
        <meta property="og:url" content={url}/>
        <meta name="twitter:title" content={title}/>
        <meta name="twitter:description" content={description}/>
        <link rel="canonical" href={url}/>
      </Head>

      <Box mb={2}>
        <Typography component="h1" variant="h4">
          Coronavirus cases in {country.name} {country.emoji}
        </Typography>
      </Box>

      <Grid container>
        <Grid item xs>
          <Card>
            <CardContent>
              <Typography variant="h5">
                Total cases
              </Typography>
              <Typography variant="h3">
                {(cases[countryKey] || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs>
          <Card>
            <CardContent>
              <Typography variant="h5">
                Total deaths
              </Typography>
              <Typography variant="h3">
                {(deaths[countryKey] || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {renderProgressComparison()}

      <>
        {
          cases[countryKey] && (
            <Box mt={3}>
              <LinearChart title={`Daily reports in ${country.name}`}
                           xaxis={dataDates}
                           yaxis={[]}
                           data={[{
                             title: 'New cases',
                             values: dailyCasesValues,
                           }, {
                             title: 'New deaths',
                             values: dailyDeathsValues,
                           }]}/>
            </Box>
          )
        }
      </>

      <>
        {
          travelRestrictions && (
            <Box mt={3}>
              <Typography variant="h4">
                Travel restrictions
              </Typography>
              <Box mt={1} mb={1}>
                <Typography variant="body1">
                  {travelRestrictions}
                </Typography>
              </Box>
              <Divider/>
            </Box>
          )
        }
      </>

      <Box mt={3}>
        <Typography variant="body1">
          <a href="/coronavirus">
            🌎 Coronavirus cases by country
          </a>
        </Typography>
      </Box>
      <Box mt={3}>
        <Typography variant="body1">
          <a href="/posts/stocks-that-could-benefit-from-the-coronavirus-outbreak-ff13b5bd">
            📈 Stocks that could benefit from the Coronavirus outbreak
          </a>
        </Typography>
      </Box>
      <Box mt={3}>
        <Typography variant="body1">
          <a href="http://partners.etoro.com/B13055_A78726_TClick_Sfs1.aspx" target="_blank"
             rel="nofollow noopener noreferrer">
            📊 Time to buy the dip or time to buy gold? What about oil? Check out this trading app.
          </a>
        </Typography>
      </Box>
      <Box mt={3}>
        <Typography variant="subtitle2">
          Data source: <a href="https://www.ecdc.europa.eu" target="_blank" rel="nofollow noopener noreferrer">ECDC</a>
        </Typography>
      </Box>

    </Layout>
  )
}

CountryCoronavirus.getInitialProps = async (ctx: NextPageContext): Promise<Props> => {
  const countryKey = (Array.isArray(ctx.query.country) ? ctx.query.country[0] : ctx.query.country)?.toLowerCase()
  const country = Object.values(countries)
    .find(country => country.name.toLowerCase().replace(/\s/g, '-') === countryKey)
  if (!country) {
    if (ctx.res) {
      ctx.res.statusCode = 404
    }
    return {
      countryKey,
      cases: {},
      deaths: {},
    }
  }

  const casesData = await RedisClient.getAllByPattern(`cases_${countryKey}*`)
  const cases: { [key: string]: number } = {}
  for (const [key, value] of Object.entries(casesData)) {
    cases[key.slice(6)] = Number(value)
  }
  const deathsData = await RedisClient.getAllByPattern(`deaths_${countryKey}*`)
  const deaths: { [key: string]: number } = {}
  for (const [key, value] of Object.entries(deathsData)) {
    deaths[key.slice(7)] = Number(value)
  }
  return {
    country,
    countryKey,
    cases,
    deaths,
    travelRestrictions: await RedisClient.get(`travel_${countryKey}`),
  }
}

export default withApollo(CountryCoronavirus)
