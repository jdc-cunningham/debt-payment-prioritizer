let modalVisible = false;

const addBtn = document.getElementById('add-debt__header-btn');
const modalContainer = document.getElementById('add-debt-modal-container');
const modalContainerCloseBtn = document.getElementById('form-debt-cancel'); // always exists in dom
const modalForm = document.getElementById('add-debt-modal');
const modalFormAddBtn = document.getElementById('form-debt-save-btn');
const dataStore = localStorage; // heh
const appBody = document.getElementById('app-body');
const totalPayDisp = document.getElementById('total-pay');
const monthlyDebtGrowthGlobal = [];
const totalDebtDisp = document.getElementById('total-debt');

let editCardId = '';

// basic modal logic

const toggleModal = () => {
  if (modalVisible) {
    modalVisible = false;
    modalContainer.classList = 'hidden';
  } else {
    modalVisible = true;
    modalContainer.classList = '';
  }
}

addBtn.addEventListener('click', toggleModal);
modalContainerCloseBtn.addEventListener('click', toggleModal);

// adding debts

const clearFields = () => {
  modalForm.querySelectorAll('input').forEach(input => input.value = '');
}

const getFormFields = () =>
  Array.from(modalForm.querySelectorAll('input')).map(input =>
    ({
      name: input.getAttribute('name'),
      val: input.value
    })
  )

const processForm = () => {
  const formValues = getFormFields();
  
  if (
    !formValues[0].val
    || !formValues[1].val
    || !formValues[2].val
  ) {
    alert('Please make sure the 3 required fields: Name, Bal, APR are filled in.');
    return;
  }

  const curData = JSON.parse(dataStore.getItem('finfinite')) || [];

  // add id
  formValues.push({
    name: 'id',
    val: Date.now()
  });

  if (curData.length) {
    curData.push(formValues);
    dataStore.setItem('finfinite', JSON.stringify(curData));
  } else { // first save
    dataStore.setItem('finfinite', JSON.stringify([formValues]));
  }

  renderCards(); // re-render
  clearFields();
  toggleModal();
}

modalFormAddBtn.addEventListener('click', () => {
  processForm();
});

// rendering debts

const bindDebtCardRemoveBtn = () => {
  document.querySelectorAll('.debt-card-del-btn').forEach(delBtn => { // checked does not build evt listeners per add
    delBtn.addEventListener('click', (e) => {
      const debtCardId = parseInt(e.target.getAttribute('id'));
      const curData = JSON.parse(dataStore.getItem('finfinite'));
      const newArr = [];

      // should just use a filter here but the nested arrays makes it more difficult

      curData.forEach(debtCard => {
        debtCard.forEach(field => {
          if (field.name === 'id' && field.val !== debtCardId) {
            newArr.push(debtCard);
          }
        })
      });

      localStorage.setItem('finfinite', JSON.stringify(newArr));
      renderCards();
    });
  });

  // edit mode
  document.querySelectorAll('.debt-card-edit-btn').forEach(editBtn => {
    editBtn.addEventListener('click', (e) => {
      editCardId = e.target.getAttribute('id');
      renderCards();
    });
  });
}

// this is used for diffing so I can see progress over time
const updateDataLog = (debtName, newBal) => {
  const check = dataStore.getItem('finfinite_balance_change');
  const dataLog = check ? JSON.parse(check) : {};

  const newEntry = {
    timestamp: Date.now(),
    balance: newBal
  };

  if (!(debtName in dataLog)) {
    dataLog[debtName] = [newEntry]
  } else {
    dataLog[debtName].unshift(newEntry);
  }

  dataStore.setItem('finfinite_balance_change', JSON.stringify(dataLog));
}

const updateBalance = (balInput, oldBal) => {
  const newBalance = balInput.value;
  const curData = JSON.parse(dataStore.getItem('finfinite'));
  const newData = [];

  curData.forEach((debtCard, cardIndex) => {
    let balId = 0;

    // yuck internal loops
    debtCard.forEach((debtInfo, index) => {
      if (debtInfo.name === 'bal') {
        balId = index;
      }

      if (debtInfo.name === 'id' && debtInfo.val === parseInt(editCardId)) {
        curData[cardIndex][balId] = {
          name: 'bal',
          val: newBalance.replace(/,/g, '') // lol more than 1?
        };

        // write to log for diff
        updateDataLog(curData[cardIndex][0].val, parseFloat(oldBal) - parseFloat(newBalance.replace(/,/g, '')));
      }
    });

    newData.push(debtCard);
  });

  localStorage.setItem('finfinite', JSON.stringify(newData));
  editCardId = '';
  renderCards();
}

// some hoisting in here
const createCard = ({
  id,
  name,
  bal,
  apr,
  dueDay,
  minPay,
  youPay,
  yearlyDebtGrowth,
  monthlyDebtGrowth,
  dailyDebtGrowth,
  editMode
}) => (
  `<div class="debt-card" id="${id}">
    <h2>Name: ${name}</h2>
    <h3>Balance: ${
      editMode
        ? `$<input type="input" value="${truncateFormatCurrency(parseFloat(bal))}" onchange="updateBalance(this, ${parseFloat(bal)})"/>`
        : `<span class="red">$${truncateFormatCurrency(parseFloat(bal))}</span></h3>`
    }</h3>
    <h3>APR: ${apr}</h3>
    <h3>Due day: ${dueDay}</h3>
    <h3>Min pay: ${minPay}</h3>
    <h3>You pay: <span class="green you-pay">$0.00</span></h3>
    <h3>Yearly debt growth: $${yearlyDebtGrowth}</h3>
    <h3>Monthly debt growth: $${monthlyDebtGrowth}</h3>
    <h3>Daily debt growth: $${dailyDebtGrowth}</h3>
    <button type="button" id="${id}" class="debt-card-del-btn" title="delete">x</button>
    <button type="button" id="${id}" class="debt-card-edit-btn" title="edit"></button>
  </div>`
);

// https://stackoverflow.com/a/4760279/2710227
const dynamicSort = (property) => {
  var sortOrder = 1;
  if(property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
  }
  return function (a,b) {
      /* next line works with strings and numbers, 
       * and you may want to customize it to your needs
       */
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
      return result * sortOrder;
  }
}

const getDebtInfoById = (curData, id) => {
  let debtInfo = {};

  for (let i = 0; i < curData.length; i++) {
    const debt = curData[i];

    for (let j = 0; j < debt.length; j++) {
      const debtField = debt[j];

      if (debtField.name === 'id' && parseInt(debtField.val) === id) {
        debtInfo = curData[i];
        break;
      }
    }
  }

  return debtInfo;
}

// https://stackoverflow.com/a/31581206/2710227
// string to float to string lol
const truncateFormatCurrency = (currencyStr) => currencyStr.toLocaleString(undefined, {maximumFractionDigits: 2});

const renderCards = () => {
  // check for and render existing entries
  const curData = JSON.parse(dataStore.getItem('finfinite')) || [];

  if (curData.length) {
    appBody.innerHTML = '';

    // figure out debt growth and sort in descending order (highest debt growth first)
    // https://stackoverflow.com/a/1069840/2710227
    // this is gonna be some nasty O log n stuff, well this is like 2n^2 (nested)

    // curData ex schema
    const debtGrowthByYearTmp = [];  // {id, growth}
    let totalDebt = 0;

    // oof this sucks, example of bad decision propagating downards into future work
    // the reason this all started is I wanted to lazily check the field by name for the required field
    // add check
    curData.forEach(debt => {
      const debtInfo = {};
      
      debt.forEach(debtField => {
        if (debtField.name === 'id') {
          debtInfo.id = debtField.val;
        }

        if (debtField.name === 'bal') {
          debtInfo.bal = debtField.val;
          totalDebt += parseFloat(debtField.val);
        }

        if (debtField.name === 'apr') {
          debtInfo.apr = debtField.val;
        }
      });

      debtGrowthByYearTmp.push(debtInfo);
    });

    totalDebtDisp.innerText = `$${truncateFormatCurrency(totalDebt)}`;

    const debtGrowthByYear = [];

    debtGrowthByYearTmp.forEach(debt => {
      debtGrowthByYear.push({
        ...debt,
        yearlyDebtGrowth: parseFloat(debt.bal) * parseFloat(debt.apr * (1/100))
      })
    });

    // do the sorting
    debtGrowthByYear.sort(dynamicSort('yearlyDebtGrowth')).reverse();

    // now (lol) use this to sort curData by this order AND import the growth data oof
    // OMG I don't even want to think what N^5 or something this is, how many nested forEach loops dang
    debtGrowthByYear.forEach(debt => {
      const debtInfo = getDebtInfoById(curData, debt.id);
      const obj = {};

      // bad design array of objects, should be just one object
      debtInfo.forEach(debtField => obj[debtField.name] = debtField.val);

      monthlyDebtGrowthGlobal.push({
        id: debt.id,
        monthlyDebtGrowth: truncateFormatCurrency(debt.yearlyDebtGrowth / 12)
      });

      const card = createCard({
        ...obj,
        yearlyDebtGrowth: truncateFormatCurrency(debt.yearlyDebtGrowth),
        monthlyDebtGrowth: truncateFormatCurrency(debt.yearlyDebtGrowth / 12),
        dailyDebtGrowth: truncateFormatCurrency((debt.yearlyDebtGrowth / 12) / 30.44), // looked this 30.4 number up on Google
        editMode: debt.id === parseInt(editCardId)
      });

      appBody.innerHTML += card;
    });

    bindDebtCardRemoveBtn();
  } else {
    appBody.innerHTML = '<p class="loading">No local data, add debt to start using the app</p>';
  }
}

renderCards();

// apply payment
const calculateBtn = document.getElementById('calculate-btn');

calculateBtn.addEventListener('click', () => {
  const amountVal = document.getElementById('pay-amount').value;

  if (!amountVal || amountVal < 0) {
    alert('Need a pay amount');
    return;
  }

  const debtCount = monthlyDebtGrowthGlobal.length;

  if (amountVal < (50 * debtCount)) {
    alert(`Not enough, based on $50 min pay per debt. Needs to be at least $${50 * debtCount}.00`);
    return;
  }

  const dividers = [];
  
  let sum = 0;

  for (let i = 1; i <= debtCount; i++) {
    if (i === 1) {
      dividers.push(0); // placeholder
    } else {
      const val = 1 / (i * i);

      dividers.push(val);
      sum += val;
    }
  }

  dividers[0] = 1 - sum;

  const payments = [];

  dividers.forEach(divider => {
    const payVal = Math.floor(divider * amountVal); // means remainder

    payments.push(payVal >= 50 ? payVal : 50); 
  });

  // update cards
  let totalPay = 0;

  monthlyDebtGrowthGlobal.forEach((debt, index) => {
    const debtCard = document.getElementById(debt.id);

    debtCard.querySelector('.you-pay').innerText = `$${payments[index]}.00`;
    totalPay += payments[index];
  });

  totalPayDisp.innerText = `$${truncateFormatCurrency(totalPay)}.00`;
});

// https://stackoverflow.com/a/10535846/2710227
const dateFromTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${month}/${day}/${year}`;
}

// compute progress
const renderProgress = () => {
  const check = dataStore.getItem('finfinite_balance_change');
  const dataLog = check ? JSON.parse(check) : {};

  if (Object.keys(dataLog).length) {
    
    const payments = {}; // date : totals

    // add another loop, crappy but predictable outcome

    Object.keys(dataLog).forEach(debtName => {
      dataLog[debtName].forEach((debtPaid, index) => {

        const datePaid = dateFromTimestamp(debtPaid.timestamp);

        if (!(datePaid in payments)) {
          payments[datePaid] = [];
        }

        payments[datePaid].push(parseFloat(debtPaid.balance * -1));
      });
    });

    Object.keys(payments).forEach(paymentDate => {
      // https://stackoverflow.com/a/16751601/2710227
      const paidValue = truncateFormatCurrency(
        payments[paymentDate].reduce((partialSum, a) => partialSum + a, 0)
      );

      const balanceDecreased = parseFloat(paidValue) >= 0;
      const progressText = balanceDecreased ? "Paid off" : "Increased";
      const progressColor = balanceDecreased ? "green" : "red";

      document.getElementById('progress-output').innerHTML += `<p class="payment-date">${paymentDate}</p><p>${progressText} <span class="${progressColor}">$${paidValue}</span></p><br/>`;
    });
  }
}

renderProgress();

// from MDN
const getAjax = (url, success) => {
  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
  xhr.open('GET', url);
  xhr.onreadystatechange = function() {
      if (xhr.readyState>3 && xhr.status==200) success(xhr.responseText);
  };
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.send();
  return xhr;
}

// sync button
const syncBtn = document.getElementById('sync');

// nasty looping
const getSetPrevBal = (prevAcctData, acctName, newBal) => {
  const acctDataCopy = prevAcctData;

  for (let i = 0; i < prevAcctData.length; i++) {
    if (prevAcctData[i][0].val === acctName) {
      // set new balance (nasty lol)
      const oldBal = acctDataCopy[i][1].val;
      acctDataCopy[i][1].val = newBal;
      dataStore.setItem('finfinite', JSON.stringify(acctDataCopy)); // so bad... like triple nested loops probably more, I'm just trying to get this done

      return oldBal;
    }    
  }
}

const getBalChange = (prev, cur) => cur - prev;

const syncGoogleSpreadsheetRow = (rowDataStr) => {
  const rowData = JSON.parse(rowDataStr)?.data;

  if (rowData?.err) {
    alert('failed to get data from Google Spreadsheet');
  }

  const accountBalances = JSON.parse(dataStore.getItem('finfinite_balance_change'));
  const updatedBalanceChanges = {};

  // in order to line this up I'm looking at my spreadsheet columns/account names
  const accountToSpreadsheetRowMap = [
    rowData[20],
    rowData[19],
    rowData[12],
    rowData[10],
    rowData[17],
    rowData[18],
    rowData[14],
    rowData[11],
    rowData[13],
    rowData[15],
    rowData[16],
    rowData[9],
  ]; // the indexes of this array correspond to the accountBalance keys orders above

  const now = Date.now();

  // update balance diff for left sidebar
  Object.keys(accountBalances).forEach((accountName, index) => {
    const accountData = JSON.parse(dataStore.getItem('finfinite')); // hmm
    const newBal = accountToSpreadsheetRowMap[index];

    updatedBalanceChanges[accountName] = [
      {
        timestamp: now,
        balance: getBalChange(getSetPrevBal(accountData, accountName, newBal), parseFloat(newBal)),
      },
      ...accountBalances[accountName]
    ]
  });

  // update storage
  dataStore.setItem('finfinite_balance_change', JSON.stringify(updatedBalanceChanges));

  syncBtn.classList = '';

  // reload page
  location.reload(); // could just re-render left-side of page
};

syncBtn.addEventListener('click', () => {
  syncBtn.classList = 'disabled';
  getAjax('http://localhost:5043/get-latest-row', syncGoogleSpreadsheetRow); // if using 192 address mixed-address issue, doesn't work using github pages
});