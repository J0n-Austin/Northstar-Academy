"""Command-line entry for synthetic finance transfer; NOT a money movement tool."""
import argparse
import json
from ledger import TransferRejected, balances, initialize, transfer


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--db', required=True, help='synthetic SQLite fixture path')
    parser.add_argument('--transfer', action='store_true')
    parser.add_argument('--source', default='A-100')
    parser.add_argument('--destination', default='B-200')
    parser.add_argument('--cents', type=int, default=1000)
    parser.add_argument('--request-id', default='REQ-001')
    args = parser.parse_args()
    initialize(args.db)
    if args.transfer:
        try:
            outcome = transfer(args.db, args.source, args.destination, args.cents, args.request_id)
        except TransferRejected as exc:
            parser.error(str(exc))
    else:
        outcome = {'status': 'balance-only'}
    print(json.dumps({'outcome': outcome, 'balances': balances(args.db)}, sort_keys=True))


if __name__ == '__main__':
    main()
