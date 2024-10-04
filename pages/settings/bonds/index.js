import { useMemo } from 'react'
import { getGetServerSideProps } from '@/api/ssrApollo'
import Layout from '@/components/layout'
import SubBondList from '@/components/sub-bond'
import { GET_USER_BONDS } from '@/fragments/subBond'
import { SettingsHeader } from '../index'
import { SubscribeUserContextProvider } from '@/components/subscribeUser'

export const getServerSideProps = getGetServerSideProps({ query: GET_USER_BONDS, authRequired: true })

export default function MyBonds ({ ssrData }) {
  const subscribeUserContextValue = useMemo(() => ({ refetchQueries: ['MySubBonds'] }), [])
  return (
    <Layout>
      <div className='pb-3 w-100 mt-2'>
        <SettingsHeader />
        <div className='mb-4 text-muted'>Posted bonds</div>
        <SubscribeUserContextProvider value={subscribeUserContextValue}>
          <SubBondList
            ssrData={ssrData} query={GET_USER_BONDS}
            destructureData={data => data.userBonds}
            variables={{}}
            rank
            nymActionDropdown
            statCompsProp={[]}
          />
        </SubscribeUserContextProvider>
      </div>
    </Layout>
  )
}
