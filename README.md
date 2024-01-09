# ZkSync-Simulator Retrohunter Software

## Introduction
ZkSync-Simulator Retrohunter is a fully automated software designed with a focus on automation, randomization, and self-sufficiency. This tool efficiently manages your accounts in a database, tracks their activity, and allows for the categorization of accounts into different groups or 'Tiers' based on their activity and attributes.

## Tiers

Accounts are separated into tiers based on specific criteria, such as the number of transactions, ownership of a domain name, and other factors.

### Tiers Default Configuration

By default, there are five tiers distributed as follows:

- **Tier 1:** 5 percent of the accounts
- **Tier 2:** 15 percent of the accounts
- **Tier 3:** 20 percent of the accounts
- **Tier 4:** 30 percent of the accounts
- **Tier 5:** 30 percent of the accounts

#### Requirements for Accounts in Tiers by Default

- **Tier 1:**
  - Transaction Count: 50
  - Is Official Bridge Needed: true
  - Is ZkSync Domain Needed: true
  - Is Dmailer Cheap Transactions Allowed: false
  - Volume: 20000
  - Unique Smart Contracts: 20

- **Tier 2:**
  - Transaction Count: 40
  - Is Official Bridge Needed: true
  - Is ZkSync Domain Needed: false
  - Is Dmailer Cheap Transactions Allowed: false
  - Volume: 15000
  - Unique Smart Contracts: 15

- **Tier 3:**
  - Transaction Count: 30
  - Is Official Bridge Needed: false
  - Is ZkSync Domain Needed: false
  - Is Dmailer Cheap Transactions Allowed: false
  - Volume: 5000
  - Unique Smart Contracts: 10

- **Tier 4:**
  - Transaction Count: 20
  - Is Official Bridge Needed: false
  - Is ZkSync Domain Needed: false
  - Is Dmailer Cheap Transactions Allowed: true
  - Volume: 1000
  - Unique Smart Contracts: 7

- **Tier 5:**
  - Transaction Count: 10
  - Is Official Bridge Needed: false
  - Is ZkSync Domain Needed: false
  - Is Dmailer Cheap Transactions Allowed: true
  - Volume: 100
  - Unique Smart Contracts: 5

### Tier Configuration

In `tier.const.ts` (in the `tiers` variable), you can view/set different requirements for different tiers. The `tierDistributionInPercents` variable will decide the distribution of tiers in your account pool. These settings can be customized as needed.

## Available Modules

- Official Bridge - Bridge
- ZkSync Name Service - Domain Name
- Dmailer - Cheap Transactions
- MuteSwap - Swap
- PancakeSwap - Swap
- SpaceFi - Swap
- SyncSwap - Swap
- Velocore - Swap

New modules will be added in future updates.

## Invocation

There are two methods to run this script:

1. Run a batch of accounts every time the script is invoked.
2. Schedule the script to run daily at a random time.

Accounts in each batch can be selected in two ways:

1. Random accounts from the entire pool.
2. Random accounts that haven't had activity in a set number of days.

By default, the script chooses to run accounts that haven't had activity in the last month, in batches of 4.

### Configuration Settings

Configurations can be tweaked in the `config.const.ts` file:

- To modify the batch size, adjust the `accountsInBatch` variable.
- To change the period after which an account should be invoked again, modify the `daysBetweenTransactionsOnAccount` variable.
- To remove the check for inactive accounts and invoke random accounts, use the `ONLY_INACTIVE_ACCOUNTS_PICKED` variable.

## Setup Instructions

1. Install [Node.js](https://nodejs.org/en/download).
2. Run `npm i` to install dependencies.
3. Place your private keys in the `eth_privates.txt` file in the project's root directory (refer to `eth_privates.example.txt`).
4. Add your proxy to the `proxies.txt` file in the project's root (refer to `proxies.example.txt`).
5. Execute `npm run bootstrap` to initialize.

To run a batch of accounts once, use `npm run start`.
To set up a scheduler for automatic activities, install forever tool - `sudo npm i -g forever` and setup scheduler with `npm run process:schedule`.

### Additional commands
`npm run update` - to update activities 
`npm run tier-distribution` - to redistribute tiers 
`npm run activities` - to get information about activities on your accounts (ZkSync checker of some sort)
`npm run balances` - to get balances of all accounts


## Support

For any questions or additional features, join our [Telegram group](https://t.me/usersimulating) or direct message me at `@humansimulacrum`.