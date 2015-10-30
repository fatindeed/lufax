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
	var cur_product_id;
	// 判断用户是否登录
	if($('#userId').val() == '') {
		$('.main-list').children('.tip').html('您还未登录，请 <a href="' + $('#header-cookie-login').attr('href') + '" class="go-login">登录</a> 后浏览可投资项目');
		return false;
	}
	// 附加“抢购”按钮
	$('.product-status').each(function() {
		if($(this).hasClass('product-status-preview')) return true;
		var product_id = $(this).children('a').prop('href').substr(49);
		$(this).append('<a href="javascript:void(0);" class="list-btn one-click" style="margin-left:6px;" data-product-id="' + product_id + '">抢购</a>');
		$(this).children('a').css({'display':'inline-block','width':'70px'});
	});
	// 抢购方法
	function packageCheck() {
		$.ajax({
			url: 'https://list.lu.com/list/service/users/products/package-check',
			method: 'POST',
			data: {'salesArea':cur_product_id,'source':'0'},
			dataType: 'json',
			success: function(r) {
				if(r.code == '66') {
					alert(r.message);
					window.location.href = 'https://list.lu.com/list/productDetail?productId=' + cur_product_id;
					// window.location.href = 'https://trading.lu.com/trading/trade-info?productId=' + cur_product_id + '&sid=' + r.sid;
				}
				// 已被抢购
				else if(r.code == '03') {
					setTimeout(function(){packageCheck()}, 1000);
				}
				else {
					$('.one-click').removeClass('is-grey');
					alert('[#' + r.code + '] ' + r.message);
				}
			}
		});
	}
	// 绑定“抢购”点击事件
	$('.one-click').click(function() {
		if($(this).hasClass('is-grey')) return false;
		$('.one-click').addClass('is-grey');
		cur_product_id = $(this).data('product-id');
		packageCheck();
	});
});