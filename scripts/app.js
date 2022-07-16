let modalVisible = false;

const addBtn = document.getElementById('add-debt__header-btn');
const modalContainer = document.getElementById('add-debt-modal-container');
const modalContainerCloseBtn = document.getElementById('form-debt-cancel'); // always exists in dom
const modalForm = document.getElementById('add-debt-modal');
const modalFormAddBtn = document.getElementById('form-debt-save-btn');
const dataStore = localStorage; // heh
const appBody = document.getElementById('app-body');
const monthlyDebtGrowthGlobal = [];

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
}

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
  dailyDebtGrowth
}) => (
  `<div class="debt-card" id="${id}">
    <h2>Name: ${name}</h2>
    <h3>Balance: <span class="red">$${bal}</span></h3>
    <h3>APR: ${apr}</h3>
    <h3>Due day: ${dueDay}</h3>
    <h3>Min pay: ${minPay}</h3>
    <h3>You pay: <span class="green you-pay">$0.00</span></h3>
    <h3>Yearly debt growth: $${yearlyDebtGrowth}</h3>
    <h3>Monthly debt growth: $${monthlyDebtGrowth}</h3>
    <h3>Daily debt growth: $${dailyDebtGrowth}</h3>
    <button type="button" id="${id}" class="debt-card-del-btn">x</button>
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
        }

        if (debtField.name === 'apr') {
          debtInfo.apr = debtField.val;
        }
      });

      debtGrowthByYearTmp.push(debtInfo);
    });

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
        dailyDebtGrowth: truncateFormatCurrency((debt.yearlyDebtGrowth / 12) / 30.44) // looked this 30.4 number up on Google
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
  monthlyDebtGrowthGlobal.forEach((debt, index) => {
    const debtCard = document.getElementById(debt.id);

    debtCard.querySelector('.you-pay').innerText = `$${payments[index]}.00`;
  });
});