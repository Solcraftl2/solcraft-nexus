import { AccountSetAsfFlags, AccountSetTfFlags } from 'xrpl'

export default function calculateAccountFlags(options = {}) {
  let flags = 0
  let setFlag
  let clearFlag

  const maybe = (flag, enable, tfSet, tfClear) => {
    if (enable === true) {
      if (tfSet) flags |= tfSet
      if (setFlag === undefined) setFlag = flag
    } else if (enable === false) {
      if (tfClear) flags |= tfClear
      if (clearFlag === undefined) clearFlag = flag
    }
  }

  maybe(AccountSetAsfFlags.asfRequireDest, options.requireDestinationTag, AccountSetTfFlags.tfRequireDestTag, AccountSetTfFlags.tfOptionalDestTag)
  maybe(AccountSetAsfFlags.asfRequireAuth, options.requireAuth, AccountSetTfFlags.tfRequireAuth, AccountSetTfFlags.tfOptionalAuth)
  maybe(AccountSetAsfFlags.asfDisallowXRP, options.disallowXRP, AccountSetTfFlags.tfDisallowXRP, AccountSetTfFlags.tfAllowXRP)
  maybe(AccountSetAsfFlags.asfDisableMaster, options.disableMaster)
  maybe(AccountSetAsfFlags.asfAccountTxnID, options.accountTxnID)
  maybe(AccountSetAsfFlags.asfNoFreeze, options.noFreeze)
  maybe(AccountSetAsfFlags.asfGlobalFreeze, options.globalFreeze)
  maybe(AccountSetAsfFlags.asfDefaultRipple, options.defaultRipple)
  maybe(AccountSetAsfFlags.asfDepositAuth, options.depositAuth)

  const result = {}
  if (flags) result.Flags = flags
  if (setFlag !== undefined) result.SetFlag = setFlag
  if (clearFlag !== undefined) result.ClearFlag = clearFlag
  return result
}
