import _ from 'lodash';
export const byCustomer = orders => _.groupBy(orders, 'customerId');
