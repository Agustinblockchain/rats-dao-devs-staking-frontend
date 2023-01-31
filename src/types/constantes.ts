
//----------------------------------------------------------------------

import { strToHex } from "../utils/utils"

//----------------------------------------------------------------------

//for creating a valid time range tx
export const validTimeRange = 15 * 60 * 1000 // = 15 minutos
export const validTimeRangeInSlots = 15 * 60  // = 15 minutos

export const txPreparingTime = 1 * 60 * 1000 // = 1 minutos
export const txConsumingTime = 2 * 60 * 1000 // = 2 minutos

//------------------------------------------

export const ADA_Decimals = 6
export const ADA_UI = "ADA"

//------------------------------------------

export const poolID_TN = "P"

export const fundID_TN = "F"

export const userID_TN = "U"

//------------------------------------------

export const scriptID_Validator_TN = "SV"

export const scriptID_Master_Fund_TN = "SMF"

export const scriptID_Master_FundAndMerge_TN = "SMFAM"

export const scriptID_Master_SplitFund_TN = "SMSF"

export const scriptID_Master_ClosePool_TN = "SMCP"

export const scriptID_Master_TerminatePool_TN = "SMTP"

export const scriptID_Master_DeleteFund_TN = "SMDF"

export const scriptID_Master_SendBackFund_TN = "SMSBF"

export const scriptID_Master_SendBackDeposit_TN = "SMSBD"

export const scriptID_Master_AddScripts_TN = "SMAS"

export const scriptID_Master_DeleteScripts_TN = "SMDS"

export const scriptID_User_Deposit_TN = "SUD"

export const scriptID_User_Deposit_For_User_TN = "SUD"

export const scriptID_User_Harvest_TN = "SUH"

export const scriptID_User_Withdraw_TN = "SUW"

//------------------------------------------

export const txID_Master_FundAndMerge_TN = "MFAM"

export const txID_Master_SplitFund_TN = "MSF"

export const txID_Master_ClosePool_TN = "MCP"

export const txID_Master_TerminatePool_TN = "MTP"

export const txID_Master_DeleteFund_TN = "MDF"

export const txID_Master_SendBackFund_TN = "MSBF"

export const txID_Master_SendBackDeposit_TN = "MSBD"

export const txID_Master_AddScripts_TN = "MAS"

export const txID_Master_DeleteScripts_TN = "MDS"

export const txID_User_Deposit_For_User_TN = "UD"

export const txID_User_Harvest_TN = "UH"

export const txID_User_Withdraw_TN = "UW"

//------------------------------------------

export const maxDiffTokensForPoolAndFundDatum = 11

export const maxDiffTokensForUserDatum = 2

export const tokenNameLenght = 3

//------------------------------------------

export const maxTokensWithDifferentNames = 2

export const maxMasters = 20

export const maxRewards = 1000000000000000n

//------------------------------------------

export const TIME_OUT_TRY_TX = 6000 // = 6 segundos

export const maxTxExMem = 14000000

export const maxTxExSteps = 10000000000

export const maxTxSize = 16384

export const maxTxFundDatumInputs = 2

//------------------------------------------

export const poolDatum_NotTerminated = 0

export const poolDatum_Terminated = 1

export const poolDatum_NotClaimedFund = 0

export const poolDatum_ClaimedFund = 1

//----------------------------------------------------------------------
