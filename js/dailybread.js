OpenSpending = "OpenSpending" in window ? OpenSpending : {};

(function ($) {

var dependentType = 'single'; // 世帯タイプ初期値
var baseKoujo = Taxes.baseKoujo; // 住民税基礎控除
var huyoKoujo = Taxes.huyoKoujo; // 一人分の扶養控除
var taxRate = Taxes.taxRate; // 住民税率

var graphSlope=[
  [  0,  800000],
  [ 30, 3500000],
  [ 80, 5500000],
  [100,20000000]
]

var tooltipTitles = {
  '議会・市役所': '議会費・総務費',
  '教育': '教育費',
  '福祉': '民生費',
  '商工労働・観光': '商工費・労働費',
  'インフラ': '土木費',
  '環境': '衛生費',
  '防災': '消防費・災害復旧費',
  '農業': '農林水産業費',
  '借金の返済': '公債費',
  'その他': '諸支出費・予備費',
  '総務管理費': '市長部局の一般事務に必要な費用',
  '徴税費': '市税など税金の徴収に必要な費用',
  '議会費': '議員報酬など、市議会活動や議会運営に必要な費用',
  '戸籍住民台帳費': '出生、死亡、転出入など住民登録に必要な費用',
  '選挙費': '選挙の管理、監督に必要な費用',
  '監査委員費': '市の歳出や事業運営の監査に必要な費用',
  '統計調査費': '国勢調査や統計調査などに必要な費用',
  '社会教育費': '青少年教育、生涯学習、文化振興などに必要な費用',
  '小学校費': '小学校の維持管理に必要な費用',
  '中学校費': '中学校の維持管理に必要な費用',
  '教育総務費': '教育委員会の一般事務に必要な費用',
  '保健体育費': 'スポーツ振興などに必要な費用',
  '児童福祉費': '保育、児童、ひとり親家庭などの支援に必要な費用',
  '社会福祉費': '障がい者、高齢者などの支援に必要な費用',
  '生活保護費': '生活保護世帯の支援に必要な費用',
  '商工費': '商業、工業、観光などの振興に必要な費用',
  '労働諸費': '勤労者支援などに必要な費用',
  '都市計画費': '都市計画道路、公園などの維持管理に必要な費用',
  '道路橋梁費': '道路の舗装修繕、除雪などに必要な費用',
  '住宅費': '市営住宅の維持管理に必要な費用',
  '河川費': '河川、水路の改修などの維持管理に必要な費用',
  '土木管理費': '道路台帳の管理事務などに必要な費用',
  '保健衛生費': '予防接種、健康の推進などに必要な費用',
  '清掃費': 'ゴミの処理、資源の収集などに必要な費用',
  '消防費': '消防施設の維持管理、消防団員の支援などに必要な費用',
  '公共土木施設災害復旧費': '土木施設の災害時に必要な費用（予備）',
  '農林水産業施設災害復旧費': '農業施設の災害時に必要な費用（予備）',
  '農業費': '農業の振興などに必要な費用',
  '公債費': '市債などの借り入れ金の利子',
  '予備費': '予備費',
  '普通財産取得費': '公共用地取得時に必要な費用（予備）'
};


var formatCurrency = function (val, prec, sym, dec, sep) {
  prec = prec === undefined ? 2 : prec
  sym = sym || '\u00A5' // Yen sign
  dec = dec || '.'
  sep = sep || ','

  var str
  var valAry = val.toFixed(prec).split('.')
  var sepAry = []

  for(var i = valAry[0].length; i > 2; i -= 3) {
    sepAry.unshift(valAry[0].slice(i-3, i))
  }
  if (i !== 0) { sepAry.unshift(valAry[0].slice(0, i)) }

  str = sym + sepAry.join(sep)
  if (prec > 0) str += dec + valAry[1]

  return str
}

OpenSpending.DailyBread = function (elem) {
  var self = this

  this.$e = $(elem)
  this.$e.data('wdmmg.dailybread', this)

  this.tiers = []
  this.areas = []
  this.iconLookup = function (name) { return undefined; };

  this.init = function () {
    this.setSalary(4000000) // default starting salary

    this.$e.find('.wdmmg-slider').slider({
      value: 50,
      min: 0,
      max: 100,
      step: 1,
      animate: true,
      slide: function () { self.sliderUpdated.apply(self, arguments) }
    })

    this.$e.delegate('.db-area-col', 'click', this.handleClick)
    this.$e.delegate('.db-area-col', 'mouseenter', this.handleMouseEnter)
  }

  this.sliderUpdated = function (evt, sld) {
    for (var i = 1; i < graphSlope.length; i++) {
        if (sld.value==100 ||
          graphSlope[i-1][0]<=sld.value && sld.value<graphSlope[i][0]){
          self.setSalary(
            graphSlope[i-1][1]+(graphSlope[i][1]-graphSlope[i-1][1])*
            (
              (sld.value-graphSlope[i-1][0])/(graphSlope[i][0]-graphSlope[i-1][0])
            )
            );
        }
    }
    self.sliderUpdate = true
    self.draw()
    self.sliderUpdate = false
  }

  this.handleMouseEnter = function() {
    var tier = $(this).closest('.db-tier')
    var areaId = parseInt($(this).attr('data-db-area'), 10)

    var data_db_area_elem = tier.find('[data-db-area='+areaId+']')[0]
    var data_db_area_text = data_db_area_elem.innerText || data_db_area_elem.textContent
    var name = data_db_area_text.replace(/\s+/g, '') // delete spaces
    var title = tooltipTitles[name]
    $(tier.find('[data-db-area='+areaId+']')[1]).attr('title', title)
    $(tier.find('[data-db-area='+areaId+']')[1]).tooltip({track: true})
  }

  this.handleClick = function () {
    var tier = $(this).closest('.db-tier')
    var tierId = parseInt(tier.attr('data-db-tier'), 10)
    var areaId = parseInt($(this).attr('data-db-area'), 10)

    // Update current selected area
    self.areas[tierId] = areaId
    // Slice off more specific selections
    self.areas = self.areas.slice(0, tierId + 1)

    tier
      .find('.db-area-col')
      .removeClass('active')
    .end()
      .find('[data-db-area='+areaId+']')
      .addClass('active')

    self.drawTier(tierId + 1)

    // Hide old tiers
    self.$e.find('.db-tier').each(function () {
      if ($(this).attr('data-db-tier') > tierId + 1) {
        $(this).hide()
      }
    })
  }

  this.setData = function (data) {
    self.data = data
  }

  this.setDataFromAggregator = function (data, skip) {
    handleChildren = function(node, absolute) {
      return _.map(
        _.filter(node.children, function(child) {
          return _.indexOf(skip, child.name);
        }),
        function(child) {
          var daily = (child.amount / node.amount);
          if (absolute) daily = daily / 365.0;
          return [child.name, child.label, daily, handleChildren(child, false)];
        });
    }
    self.setData(handleChildren(data, true));
  }

  this.setIconLookup = function(lookup) {
    self.iconLookup = lookup;
  }

  this.setSalary = function (salary) {
    self.salaryVal = salary
    self.taxVal = (salary - (baseKoujo + (dependentType == 'family' ? huyoKoujo : 0))) * taxRate;
  }

  this.draw = function () {
    self.drawTotals()
    self.drawTier(0)
    for (var i = 0, tot = self.tiers.length; i < tot; i += 1) {
      self.drawTier(i)
    }
  }

  this.drawTotals = function () {
    $('#db-salary p').text(formatCurrency(self.salaryVal, 0))
    $('#db-tax p').text(formatCurrency(self.taxVal, 0))
  }

  this.drawTier = function (tierId) {
    var tdAry = self.taxAndDataForTier(tierId)
    if (!tdAry) { return } // No child tier for selected area.
    var tax = tdAry[0], data = tdAry[1]

    var t = self.tiers[tierId] = self.tiers[tierId] || $("<div class='db-tier' data-db-tier='" + tierId + "'></div>").appendTo(self.$e)
    var n = data.length
    var w = 100.0 / n

    var icons = _.map(data, function(d) { return self.iconLookup(d[0]); });

    if (!self.sliderUpdate) {
      var tpl = "<div class='db-area-row'>" +
                "<% _.each(areas, function(area, idx) { %>" +
                "  <div class='db-area-col db-area-title' style='width: <%= width %>%;' data-db-area='<%= idx %>'>" +
                "    <h3><%= area[1] %></h3>" +
                "  </div>" +
                "<% }); %>" +
                "</div>" +
                "<div class='db-area-row'>" +
                "<% _.each(areas, function(area, idx) { %>" +
                "  <div class='db-area-col' style='width: <%= width %>%;' data-db-area='<%= idx %>'>" +
                "    <div class='db-area-icon' data-svg-url='<%= icons[idx] %>'></div>" +
                "    <div class='db-area-value'></div>" +
                "  </div>" +
                "<% }); %>" +
                "</div>"

      t.html(_.template(tpl, { activeArea: self.areas[tierId], areas: data, width: w, icons: icons }))

      self.drawIcons(t);
    }

    // Update values
    var valEls = t.find('.db-area-value')
    _.each(data, function (area, idx) {
      valEls.eq(idx).text(formatCurrency(tax * area[2], 2))
    })

    t.show()
  }

  this.taxAndDataForTier = function (tierId) {
    var data = self.data
    var tax = self.taxVal
    var areaId

    for (var i = 0, tot = tierId; i < tierId; i += 1) {
      areaId = self.areas[i]
      if (data[areaId]) {
        tax = tax * data[areaId][2]
        data = data[areaId][3]
      } else {
        return null
      }
    }
    return [tax, data]
  }

  this.drawIcons = function(t) {
    var iconRad = 35;
    $('.db-area-icon svg', t).remove();
    $('.db-area-icon', t).each(function(i,e) {
      var iconUrl, paper;
      iconUrl = $(e).data('svg-url');
      paper = Raphael(e, iconRad+iconRad,iconRad+iconRad+5);
      paper.circle(iconRad,iconRad,iconRad).attr({ fill: '#830242', stroke: 'none' });
      paper.circle(iconRad,iconRad,iconRad-2).attr({ fill: 'none', stroke: '#eee', opacity: .8, 'stroke-dasharray': '- ' });
      $.get(iconUrl, function(svg) {
        if (typeof(svg) == "string") {
          svg = $(svg);
          svg = svg[svg.length-1];
        }
        //if (!svg.getElementsByTagName) return;
        try {
          var j, icon,
          joined='',
          paths = svg.getElementsByTagName('path');
          for (j=0;j<paths.length;j++) joined += paths[j].getAttribute('d')+' ';
          icon = paper.path(joined);
          icon.attr({ fill: 'white', stroke: 'none' });
          icon.scale(iconRad/50, iconRad/50, 0, 0);
        } catch (e) {
          // failed to handle SVG
        }
      });
    });
  }

  this.init()
  return this
}

// Draw depentent type icons
OpenSpending.renderDependentTypes = function(db) {
  function draw(iconPath, target, selected) {
    var iconRad = 35;

    if (selected) {
      $(target).addClass('active');
    }

    $(target).bind('click', handleClick);

    var r = Raphael(target, iconRad * 2, iconRad * 2 + 5);
    r.circle(iconRad,iconRad,iconRad).attr({ fill: '#830242', stroke: 'none' });
    r.circle(iconRad,iconRad,iconRad-2).attr({ fill: 'none', stroke: '#eee', opacity: .8, 'stroke-dasharray': '- ' });
    $.get(iconPath, function(svg) {
      if (typeof(svg) == "string") {
        svg = $(svg);
        svg = svg[svg.length-1];
      }
      if (!svg.getElementsByTagName) return;
      var j, icon,
      joined='',
      paths = svg.getElementsByTagName('path');
      for (j=0;j<paths.length;j++) joined += paths[j].getAttribute('d')+' ';
      icon = r.path(joined);
      icon.attr({ fill: 'white', stroke: 'none' });
      icon.scale(iconRad/50, iconRad/50, 0, 0);
    });
  }

  function handleClick(el) {
    if ($(this).hasClass('active')) {
      // NOP
    } else {
      $('.active', $(this).parent()).removeClass('active');
      $(this).addClass('active');

      if ($(this).hasClass('family')) {
        dependentType = 'family';
      } else {
        dependentType = 'single';
      }
      db.setSalary(db.salaryVal);
      db.draw();
    }
  }

  draw('/icons/family.svg', $('#select-dependents-type .family')[0], false);
  draw('/icons/post-secondary.svg', $('#select-dependents-type .single')[0], true);
}

})(jQuery)

