function number_format(x) {
	if(isNaN(x)) return '';
	n = x.toString().split('.');
	return n[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (n.length>1 ? '.' + n[1] : '.00');
}

$(function() {
	// 参数相关表单字段
	var filter_fields = {"amount":["minInvestAmount","maxInvestAmount"],"period":["minInvestPeriod","maxInvestPeriod"]};
	// 变现通固定参数
	var selection_modifiers = {"amount":[{"label":"1\u4e07\u5143","value":"10000"},{"label":"5\u4e07\u5143","value":"50000"},{"label":"10\u4e07\u5143","value":"100000"}],"period":[{"label":"3\u5929","value":"3"},{"label":"7\u5929","value":"7"},{"label":"14\u5929","value":"14"},{"label":"45\u5929","value":"45"}]};
	// 替换页面搜索栏
	$('.selection').each(function() {
		var identity = $(this).find('[data-identity]').data('identity');
		if(selection_modifiers[identity]) {
			var content = '', class_name;
			for(var i in selection_modifiers[identity]) {
				class_name = 'cur';
				for(var j in filter_fields[identity]) {
					if(document.getElementById(filter_fields[identity][j]).value != selection_modifiers[identity][i].value) {
						class_name = '';
						break;
					}
				}
				content += '<li><a class="' + class_name + '" href="javascript:void(0);" data-value="' + selection_modifiers[identity][i].value + '">' + selection_modifiers[identity][i].label + '</a></li>';
			};
			$(this).html(content);
			$(this).next('div.invest-range-list-wrap').remove();
			$(this).find('a').click(function() {
				// 设置参数
				for(var i in filter_fields[identity]) {
					document.getElementById(filter_fields[identity][i]).value = $(this).data('value');
				}
				// 过滤参数
				$('#currentPage').remove();
				$('#filterForm').children('input').each(function() {
					if($(this).val() == '') $(this).remove();
				});
				// 提交搜索表单
				$('#filterForm').prop('action', 'https://list.lu.com/list/bianxiantong').submit();
			});
		}
	});
	// 判断用户是否登录
	if($('#userId').val() == '') {
		$('.main-list').children('.tip').html('您还未登录，请 <a href="' + $('#header-cookie-login').attr('href') + '" class="go-login">登录</a> 后浏览可投资项目');
		return false;
	}
	// 当前抢购商品
	var cur_product_id;
	// 计数器
	var counter = 0;
	// 刷新产品页面
	function packageRefresh() {
		$.ajax({
			url: window.location.href,
			dataType: 'text'
		})
		.done(function(data, status, xhr) {
			var node = $(data).find('.main-list');
			if(node.children('.product-list').length > 0) {
				$('.main-list').html(node.html());
				initOneClickButton();
				if($('.one-click').length == 1) {
					$('.one-click').click();
				}
			}
			else {
				setTimeout(function(){packageRefresh();}, 1000);
			}
		})
		.fail(function(xhr, status, error) {
			console.log(xhr.status + ' ' + xhr.statusText);
		});
	}
	// 附加“抢购”按钮
	function initOneClickButton() {
		$('.product-status').each(function() {
			if($(this).hasClass('product-status-preview')) return true;
			var product_id = $(this).children('a').prop('href').substr(49);
			$(this).append('<a class="list-btn one-click" href="javascript:void(0);" style="margin-left:6px;" data-product-id="' + product_id + '">抢购</a>');
			$(this).children('a').css({'display':'inline-block','width':'70px'});
		});
	}
	// 抢购
	function packageCheck() {
		$.ajax({
			url: 'https://list.lu.com/list/service/users/products/package-check',
			method: 'POST',
			data: {'salesArea':cur_product_id,'source':'0'},
			dataType: 'json'
		})
		.done(function(data, status, xhr) {
			if(data.code == '66') {
				alert(data.message);
				window.location.href = 'https://list.lu.com/list/productDetail?productId=' + cur_product_id;
				// window.location.href = 'https://trading.lu.com/trading/trade-info?productId=' + cur_product_id + '&sid=' + data.sid;
			}
			// 已被抢购
			else if(data.code == '03') {
				setTimeout(function(){packageCheck();}, 1000);
			}
			else {
				$('.one-click').removeClass('is-grey');
				alert('[#' + data.code + '] ' + data.message);
			}
		})
		.fail(function(xhr, status, error) {
			console.log(xhr.status + ' ' + xhr.statusText);
			setTimeout(function(){packageCheck();}, 1000);
		})
		// 更新剩余可投资金额
		.always(function() {
			counter++;
			if(counter % 10 == 0) {
				$.ajax({
					url: 'https://list.lu.com/list/service/product/' + cur_product_id + '/productDetail?_=' + new Date().getTime(),
					dataType: 'json'
				})
				.done(function(data, status, xhr) {
					$('.collection-method').children('em').html(number_format(data.remainingAmount));
				});
			}
		});
	}
	// 附加“监控”按钮
	$('dl.last-col').html('<dt></dt><dd class="clearfix"><a class="list-btn list-btn-preview auto-refresh" href="javascript:void(0);" style="margin-top:4px;">开始运行</a></dd>');
	$('.auto-refresh').click(function() {
		packageRefresh();
	});
	initOneClickButton();
	// 绑定“抢购”点击事件
	$('.main-list').on('click', '.one-click', function() {
		if($(this).hasClass('is-grey')) return false;
		$('.one-click').addClass('is-grey');
		cur_product_id = $(this).data('product-id');
		packageCheck();
	});
});