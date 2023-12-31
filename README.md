ZkSync-Simulator Retrohunter Software.

Fully automated software with emphasis on automatization, randomization and self-sufficiency.
This software packs your accounts in the database, tracks theirs activity and allows you to separate your accounts into different groups, Rich to Broke, those groups are later refered as Tiers.

Tiers:

For example - Account that already has 20 transactions, domain name and is significantly better that other accounts, will be in Tier 1.
Account which has 5 transaction will be in the Tier 5.


Tiers Default Configuration:

By default we have 5 tiers, distributed like this:
    Tier 1: 5 percent of the accounts,
    Tier 2: 15 percent of the accounts,
    Tier 3: 20 percent of the accounts,
    Tier 4: 30 percent of the accounts,
    Tier 5: 30 percent of the accounts,

Requirements for accounts in Tiers by default:
  Tier 1:
    Transaction Count: 50,
    Is Official Bridge Needed: true,
    Is ZkSync Domain Needed: true,
    Is Dmailer Cheap Transactions Allowed: false,
    Volume: 20000,
    Unique Smart Contracts: 20,

Tier 2:
    Transaction Count: 40,
    Is Official Bridge Needed: true,
    Is ZkSync Domain Needed: false,
    Is Dmailer Cheap Transactions Allowed: false,
    Volume: 15000,
    Unique Smart Contracts: 15,

Tier 3:
    Transaction Count: 30,
    Is Official Bridge Needed: false,
    Is ZkSync Domain Needed: false,
    Is Dmailer Cheap Transactions Allowed: false,
    Volume: 5000,
    Unique Smart Contracts: 10,
  
Tier 4:
    Transaction Count: 20,
    Is Official Bridge Needed: false,
    Is ZkSync Domain Needed: false,
    Is Dmailer Cheap Transactions Allowed: true,
    Volume: 1000,
    Unique Smart Contracts: 7,

Tier 5:
    Transaction Count: 10,
    Is Official Bridge Needed: false,
    Is ZkSync Domain Needed: false,
    Is Dmailer Cheap Transactions Allowed: true,
    Volume: 100,
    Unique Smart Contracts: 5,

Tier configuration:

In ```tier.const.ts``` (```tiers``` variable) you would be able to see/set different requirements for different tiers, that will be satisfied by script if they are not already.
```tierDistributionInPercents``` - will decide the distribution of the tiers in your account pool. You can change it too.


Available Modules:

    Official Bridge - Bridge
    ZkSync Name Service - Domain Name
    Dmailer - Cheap Transactions
    
    MuteSwap - Swap
    PancakeSwap - Swap
    SpaceFi - Swap
    SyncSwap - Swap
    Velocore - Swap
    
The script structure is set, so new modules will be added shortly.

Invokation:

There are 2 ways, how this script can be run:
1. Runs batch of accounts every time when script is invoked.
2. Schedules to run script every day at random time.

And 2 ways, how accounts in batch can be selected: 
1. Just random accounts from the whole pool.
2. Random accounts that haven't had activity in the set amount of days.

By default script chooses to run accounts that haven't had activity in the last month, in batches of 4.

Configs to tweak that are in the ```config.const.ts`` file:

To increase/decrease batch amount - ```accountsInBatch``` var
To increase/decrease amount of days after which account should be invoked again - ```daysBetweenTransactionsOnAccount``` variable.
To remove check for the inactive and invoke random accounts - ```ONLY_INACTIVE_ACCOUNTS_PICKED``` variable.

How to setup everything: 
- Install Node.js. https://nodejs.org/en/download
- npm i 
- Put your private keys in the ```eth_privates.txt``` file in the project's root (near eth_privates.example.txt).
- Put your proxy in the ```proxies.txt``` file in the project's root (near ```proxies.example.txt``).
- npm run bootstrap

To run batch of accounts once - ```npm run start```
To run scheduler that automatically triggers activities - ```npm run schedule```


Any questions, additions - https://t.me/usersimulating group or dm me - @humansimulacrum.

Happy hacking!