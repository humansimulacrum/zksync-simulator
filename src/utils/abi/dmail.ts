export const DMAIL_ABI = [
  {
    type: 'function',
    name: 'send_mail',
    constant: false,
    inputs: [
      {
        name: 'to',
        type: 'string',
        baseType: 'string',
        _isParamType: true,
      },
      {
        name: 'subject',
        type: 'string',
        baseType: 'string',
        _isParamType: true,
      },
    ],
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    _isFragment: true,
  },
];
