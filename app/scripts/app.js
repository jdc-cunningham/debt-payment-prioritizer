let modalVisible = false;

const addBtn = document.getElementById('add-debt__header-btn');
const modalContainer = document.getElementById('add-debt-modal-container');
const modalContainerCloseBtn = document.getElementById('form-debt-cancel'); // always exists in dom
const modalForm = document.getElementById('add-debt-modal');
const modalFormAddBtn = document.getElementById('form-debt-save-btn');
const dataStore = localStorage; // heh
const appBody = document.getElementById('app-body');

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
          console.log(field, debtCardId);
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
  dailyDebtGrowth,
  realTimeGrowth
}) => (
  `<div class="debt-card" id="${id}">
    <h2>Name: ${name}</h2>
    <h3>Balance: ${bal}</h3>
    <h3>APR: ${apr}</h3>
    <h3>Due day: ${dueDay}</h3>
    <h3>Min pay: ${minPay}</h3>
    <h3>You pay: ${youPay}</h3>
    <h3>Yearly debt growth: $${yearlyDebtGrowth}</h3>
    <h3>Monthly debt growth: $${monthlyDebtGrowth}</h3>
    <h3>Daily debt growth: $${dailyDebtGrowth}</h3>
    <h3>Real time growth: $${realTimeGrowth}</h3>
    <button type="button" id="${id}" class="debt-card-del-btn">x</button>
  </div>`
);

// https://stackoverflow.com/a/1129270/2710227
const compare = (a, b) => {
  if ( a.last_nom < b.last_nom ){
    return -1;
  }
  if ( a.last_nom > b.last_nom ){
    return 1;
  }
  return 0;
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
        // https://stackoverflow.com/a/31581206/2710227
        yearlyDebtGrowth: (parseFloat(debt.bal) * parseFloat(debt.apr * (1/100))).toLocaleString(undefined, {maximumFractionDigits: 2}) // string to float to string lol
      })
    });

    // do the sorting
    debtGrowthByYear.sort(compare).reverse();

    // now (lol) use this to sort curData by this order AND import the growth data oof
    // OMG I don't even want to think what N^5 or something this is, how many nested forEach loops dang
    debtGrowthByYear.forEach(debt => {
      const debtInfo = getDebtInfoById(curData, debt.id);
      const obj = {};

      // bad design array of objects, should be just one object
      debtInfo.forEach(debtField => obj[debtField.name] = debtField.val);

      const card = createCard({
        ...obj,
        yearlyDebtGrowth: debt.yearlyDebtGrowth
      });

      appBody.innerHTML += card;
    });

    bindDebtCardRemoveBtn();
  } else {
    appBody.innerHTML = '<p class="loading">No local data, add debt to start using the app</p>';
  }
}

renderCards();