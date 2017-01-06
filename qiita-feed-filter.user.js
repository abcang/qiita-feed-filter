// ==UserScript==
// @name         Qiita Feed Filter
// @namespace    https://abcang.net/
// @version      0.1
// @description  Qiitaのフィードをタグやいいねなどでフィルタリングします
// @author       ABCanG
// @match        http://qiita.com/*
// @grant        none
// ==/UserScript==



(function() {
    'use strict';

    if (! location.pathname.match(/^\/(items|mine|stock|)$/)) {
        return;
    }

    function getAction($item) {
        if (!$item.is('.item-box')) {
            return 'follow';
        }

        var $fa = $item.find('.action-icon .fa');
        if (!$fa[0]) {
            return 'other';
        }

        return $fa[0].classList.value.match(/fa-(\S+)/)[1];
    }

    function applyFilter(item, rule) {
        var $item = $(item);
        var action = getAction($item);

        $item.removeClass('hidden');

        if ((!rule[action]) ||
            (rule.stock && rule.like && $item.hasClass('default-hidden'))) {
            $item.addClass('hidden');
        }
    }

    function mapFragment(fragment) {
        var elementList = [];
        var children = fragment.children;

        for (var i = children.length - 1; i >= 0; i--) {
            var ele = children[i];
            if ($(ele).hasClass('hidden')) {
                $(ele).removeClass('hidden');
                $(ele).addClass('default-hidden');
            }

            applyFilter(ele, filter);
            elementList.unshift(ele);
        }

        return elementList.reduce(function(fm, ele) {
            fm.appendChild(ele);
            return fm;
        }, document.createDocumentFragment());
    }

    jQuery.fn._append = jQuery.fn.append;
    jQuery.fn.append = function(args) {
        if (!(args instanceof DocumentFragment)) {
            return jQuery.fn._append.call(this, args);
        }

        var fragment = mapFragment(args);
        return jQuery.fn._append.call(this, fragment);
    };

    jQuery.fn._prepend = jQuery.fn.prepend;
    jQuery.fn.prepend = function(args) {
        if (!(args instanceof DocumentFragment)) {
            return jQuery.fn._prepend.call(this, args);
        }

        var fragment = mapFragment(args);
        return jQuery.fn._prepend.call(this, fragment);
    };

    var filterList = [
        ['stock', 'ストック'],
        ['like', 'いいね'],
        ['tag', 'タグ'],
        ['comment', 'コメント'],
        ['follow', 'フォロー'],
        ['other', 'その他'],
    ];
    var filter = filterList.reduce(function(obj, item) {
        obj[item[0]] = Number(window.localStorage && window.localStorage.getItem('filter-' + item[0])) || 0;
        return obj;
    }, {});

    var $stream = $($('.following-stream')[0]);
    $stream.find('div:first').css({marginTop: '25px'});

    var $list = $('<div>').append(filterList.map(function(item) {
        return $('<label>').append([
            $('<input>').addClass('qiita-filter').attr({
                id: 'filter-' + item[0],
                name: item[0],
                type: 'checkbox',
                checked: (filter[item[0]] || null)
            }),
            $('<span>').text(item[1])
        ]).attr({for: 'filter-' + item[0]}).css({
            display: 'inline-block',
            paddingLeft: '5px'
        });
    }));
    $($stream).prepend($list);

    $('.qiita-filter').on('change', function() {
        var $this = $(this);
        var name = $this.attr('name');
        filter[name] = $this.is(':checked') ? 1 : 0;
        if (window.localStorage) {
            window.localStorage.setItem('filter-' + name, filter[name]);
        }

        $('.activities > div').each(function() {
            applyFilter(this, filter);
        });
    });

})();

