import { useMe } from './me'
import { useShowModal } from './modal'
import { Alert, Button } from 'react-bootstrap'
import CancelButton from './cancel-button'
import { usePaidMutation } from './use-paid-mutation'
import { POST_SUB_BOND } from '@/fragments/paidAction'
import { useToast } from './toast'
import { useCallback, useMemo } from 'react'
import { GET_USER_BONDS, RECLAIM_USER_BOND } from '@/fragments/subBond'
import { useMutation, useQuery } from '@apollo/client'
import { useData } from './use-data'
import styles from './item.module.css'
import MoreFooter from './more-footer'
import Dropdown from 'react-bootstrap/Dropdown'
import { numWithUnits, formatExpiration } from '@/lib/format'
import Info from './info'
export function PostSubBondComponent ({ sub, onClose, onCompleted, onError }) {
  const me = useMe()
  const [postBond] = usePaidMutation(POST_SUB_BOND)

  if (!me) return <></>

  return (
    <>
      <div className='text-center fw-bold text-muted'>
        Post a bond to {sub.name}
      </div>
      <div className='text-center'>
        This territory requires you to post a bond of
        <span className='fw-bold'> {sub.bondCostSats} sats</span> for
        <span className='fw-bold'> {sub.bondDurationDays} days</span> to post.
        <Button
          variant='primary'
          size='sm'
          onClick={async () => {
            onClose()
            const { error, payError } = await postBond({
              variables: { subName: sub.name },
              onCompleted
            })
            if (error) {
              console.error(error)
              if (onError) onError(error)
            }
            if (payError) {
              console.error(payError)
              if (onError) onError(payError)
            }
          }}
        >post bond
        </Button>
        <CancelButton onClick={onClose} />
      </div>
    </>
  )
}

export function ForfeitSubBondDropDownItem ({ sub, user }) {
  const { data } = useQuery(GET_USER_BONDS, {
    nextFetchPolicy: 'no-cache',
    fetchPolicy: 'no-cache',
    variables: { subName: sub?.name, userId: user?.id, filterByStatus: 'active' }
  })
  const showModal = useShowModal()
  const toaster = useToast()
  return (
    <>
      {data?.userBonds?.bonds?.[0] && (
        <Dropdown.Item
          onClick={async () => {
            showModal(onClose => (
              <ForfeitUserBondComponent sub={sub} user={user} onClose={onClose} onCompleted={() => toaster.success('bond forfeited')} onError={e => toaster.danger(e.message)} />
            ))
          }}
          className='text-danger'
        >
          <span className='text-danger'>Forfeit bond</span>
        </Dropdown.Item>
      )}
    </>
  )
}

export function ManageSubBondComponent ({ sub, onClose, onCompleted, onError }) {
  const me = useMe()

  const { data } = useQuery(GET_USER_BONDS, {
    nextFetchPolicy: 'no-cache',
    fetchPolicy: 'no-cache',
    variables: { subName: sub.name, filterByStatus: 'active' }
  })

  const [claimBond] = useMutation(RECLAIM_USER_BOND)

  if (!me) return <></>

  const bond = data?.userBonds?.bonds?.[0]
  return (
    <>
      <div className='text-center fw-bold text-muted'>
        Your bond is locked for {formatExpiration(bond?.reclaimableInSeconds)}
      </div>
      <div className='text-center'>
        This territory requires you to post a bond of
        <span className='fw-bold'> {sub.bondCostSats} sats</span> for
        <span className='fw-bold'> {sub.bondDurationDays} days</span> to post.
        <Button
          variant='primary'
          size='sm'
          onClick={async () => {
            const { error, payError } = await claimBond({
              variables: { subName: sub.name },
              onCompleted
            })
            if (error) {
              console.error(error)
              if (onError) onError(error)
            }
            if (payError) {
              console.error(payError)
              if (onError) onError(payError)
            }
            if (onClose) onClose()
          }}
        >re-claim bond
        </Button>
        <CancelButton onClick={onClose} />
      </div>
    </>
  )
}

export function ForfeitUserBondComponent ({ sub, user, onClose, onCompleted, onError }) {
  const me = useMe()

  return (
    <>
      <div className='text-center fw-bold text-muted'>
        Forfeir user bond
      </div>
      <div className='text-center'>
        This territory requires you to post a bond of
        <span className='fw-bold'> {sub.bondCostSats} sats</span> for
        <span className='fw-bold'> {sub.bondDurationDays} days</span> to post.
        <Button
          variant='primary'
          size='sm'
          onClick={async () => {
            if (onClose) onClose()
          }}
        >re-claim bond
        </Button>
        <CancelButton onClick={onClose} />
      </div>
    </>
  )
}

export function SubBondStatus ({ sub, inline, reply }) {
  const me = useMe()
  const toaster = useToast()
  if (!me) return (<> </>)
  const showModal = useShowModal()
  const isOwner = false && sub?.userId + '' !== me?.id
  const isBondPosted = sub?.meActiveBond

  if (isOwner) return (<> </>)

  const showPostBondPopup = useCallback(() => {
    showModal(onClose => (
      <PostSubBondComponent sub={sub} onClose={onClose} onCompleted={() => toaster.success('bond posted')} onError={e => toaster.danger(e.message)} />
    ))
  }, [sub, showModal])

  const showManageBondPopup = useCallback(() => {
    showModal(onClose => (
      <ManageSubBondComponent sub={sub} onClose={onClose} onCompleted={() => toaster.success('bond managed')} onError={e => toaster.danger(e.message)} />
    ))
  }, [sub, showModal])

  if ((!isBondPosted)) {
    const tx = <>you must have an active bond to {reply ? 'reply' : 'post'} in this territory</>
    if (inline) {
      return (
        <div className='small d-flex flex-row align-items-center text-muted'>
          {tx}
          <Button
            variant='link'
            size='sm'
            onClick={() => showPostBondPopup()}
          >learn more
          </Button>
        </div>
      )
    } else {
      return (
        <Alert variant='danger' className='mt-3 d-flex flex-column justify-content-center align-items-center'>
          <p>{tx}</p>
          <Button
            variant='link'
            size='sm'
            onClick={() => showPostBondPopup()}
          >learn more
          </Button>
        </Alert>
      )
    }
  } else {
    if (!inline) {
      return (
        <Alert variant='success' className='mt-3 d-flex flex-column justify-content-center align-items-center'>
          <p>you have an active bond in this territory</p>
          <Button
            variant='link'
            size='sm'
            onClick={() => showManageBondPopup()}
          >manage
          </Button>
        </Alert>
      )
    }
  }
}

export default function SubBondList ({ ssrData, query, variables, destructureData, rank, footer = true, nymActionDropdown, statCompsProp }) {
  const { data, fetchMore } = useQuery(query, { variables })
  const dat = useData(data, ssrData)

  const { users, cursor } = useMemo(() => {
    if (!dat) return {}
    if (destructureData) {
      return destructureData(dat)
    } else {
      return dat
    }
  }, [dat])

  if (!dat) {
    return <BondsSkeleton />
  }

  const bonds = data?.userBonds?.bonds

  return (
    <>
      <div className={styles.grid}>
        {bonds?.sort((a, b) => {
          if (a.bondStatus === 'active' && b.bondStatus !== 'active') return -1
          if (a.bondStatus !== 'active' && b.bondStatus === 'active') return 1
          if (a.bondStatus === 'active' && b.bondStatus === 'active') {
            return a.reclaimableInSeconds - b.reclaimableInSeconds
          }
          return new Date(a.created_at) - new Date(b.created_at)
        }).map((bond, i) => (
          <div className={styles.grid} key={i}>
            <div className={styles.rank}>
              {i}
            </div>
            <div className='d-flex flex-column'>
              <div>
                <span>{bond.subName}</span>
              </div>
              <small className={`d-flex ${bond.reclaimableInSeconds > 0 ? 'text-muted' : 'text-success'} flex-row align-items-center gap-2`}>
                <span>
                  {numWithUnits(bond.bondCostSats)}
                  {bond.reclaimableInSeconds > 0 ? ' locked for ' + formatExpiration(bond.reclaimableInSeconds) : ' reclaimable'}
                </span>
                {bond.reclaimableInSeconds < 0
                  ? (
                    <>
                      <Button
                        variant='link'
                        size='sm'
                        onClick={() => {
                          console.log('reclaim', bond)
                        }}
                      >reclaim
                      </Button>
                      <Info>
                        If you reclaim your bond, you will no longer be able to post in {bond.subName} until you post a new bond.
                      </Info>
                    </>
                    )
                  : (
                    <Info>
                      If you don't interact with {bond.subName} for {formatExpiration(bond.reclaimableInSeconds)} days, you can reclaim your bond.
                    </Info>
                    )}
              </small>
            </div>
          </div>
        ))}
      </div>
      {footer &&
        <MoreFooter cursor={cursor} count={users?.length} fetchMore={fetchMore} Skeleton={BondsSkeleton} noMoreText='NO MORE' />}
    </>
  )
}

export function BondsSkeleton () {
  const users = new Array(21).fill(null)

  return (
    <div>{users.map((_, i) => (
      <BondSkeleton key={i} className='mb-2'>
        <div className={styles.other}>
          <span className={`${styles.otherItem} clouds`} />
          <span className={`${styles.otherItem} clouds`} />
          <span className={`${styles.otherItem} ${styles.otherItemLonger} clouds`} />
          <span className={`${styles.otherItem} ${styles.otherItemLonger} clouds`} />
        </div>
      </BondSkeleton>
    ))}
    </div>
  )
}

export function BondSkeleton ({ children, className }) {
  return (
    <div className={`${styles.item} ${styles.skeleton} ${className}`}>
      {children}
    </div>
  )
}
