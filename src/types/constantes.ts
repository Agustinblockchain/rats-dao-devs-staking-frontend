
//----------------------------------------------------------------------

import { strToHex } from "../utils/utils"

//----------------------------------------------------------------------

//for creating a valid time range tx
export const validTimeRange = 15 * 60 * 1000 // = 15 minutos
export const validTimeRangeInSlots = 15 * 60  // = 15 minutos

export const isPreparingTime = 2 * 60 * 1000 // = 15 minutos
export const isConsumingTime = 3 * 60 * 1000 // = 15 minutos

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

export const maxDiffTokensForUserDatum = 3

export const tokenNameLenght = 20

//------------------------------------------

export const maxTokensWithDifferentNames = 20

export const maxMasters = 20

export const maxRewards = 1000000000000000n

//------------------------------------------

export const TIME_OUT_TRY_TX = 6000 // = 6 segundos

export const maxTxExMem = 14000000

export const maxTxExSteps = 10000000000

export const maxTxSize = 16384

//------------------------------------------

export const poolDatum_NotTerminated = 0

export const poolDatum_Terminated = 1

export const poolDatum_NotClaimedFund = 0

export const poolDatum_ClaimedFund = 1

//----------------------------------------------------------------------

export const pkhCreators = ["95cf8ad789addbff0618da44795de93aa9837c0806442ce1e40913b9", "874891054401ed1de714800fa7d2ac8246db504869dd0ccf56ee1a82", "4ca78fc87f397e9ab0735f9ec6659c7b49e110d64e2898c03fb5809f", "ed03815867fcf3d4339e0ea59c761dc15d569af70604c988eb311e53", "553d144a6086ce5801f965786e0e87d7d0054907fad936fcf0710d15", "abfff883edcf7a2e38628015cebb72952e361b2c8a2262f7daf9c16e", "9d19b5fbae262b24d9f44f8fe02475e1c95fdb20dbc39268b7567202", "6b482ade57ace3b77997fb9aa795b821868cc3d384a2a3d52b63f3ab"]
export const pkhAdminGeneral = ["95cf8ad789addbff0618da44795de93aa9837c0806442ce1e40913b9", "abfff883edcf7a2e38628015cebb72952e361b2c8a2262f7daf9c16e"]

//----------------------------------------------------------------------
