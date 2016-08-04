/**
 * Concrete bar chart/histogram implementation.
 *
 * Examples:
 * - {@link http://dc-js.github.com/dc.js/ Nasdaq 100 Index}
 * - {@link http://dc-js.github.com/dc.js/crime/index.html Canadian City Crime Stats}
 * @name barChart
 * @memberof dc
 * @mixes dc.stackMixin
 * @mixes dc.coordinateGridMixin
 * @example
 * // create a bar chart under #chart-container1 element using the default global chart group
 * var chart1 = dc.barChart('#chart-container1');
 * // create a bar chart under #chart-container2 element using chart group A
 * var chart2 = dc.barChart('#chart-container2', 'chartGroupA');
 * // create a sub-chart under a composite parent chart
 * var chart3 = dc.barChart(compositeChart);
 * @param {String|node|d3.selection|dc.compositeChart} parent - Any valid
 * {@link https://github.com/mbostock/d3/wiki/Selections#selecting-elements d3 single selector}
 * specifying a dom block element such as a div; or a dom element or d3 selection.  If the bar
 * chart is a sub-chart in a {@link #dc.compositeChart Composite Chart} then pass in the parent
 * composite chart instance instead.
 * @param {String} [chartGroup] - The name of the chart group this chart instance should be placed in.
 * Interaction with a chart will only trigger events and redraws within the chart's group.
 * @return {dc.barChart}
 */
dc.barChart = function (parent, chartGroup) {
    var MIN_BAR_WIDTH = 1;
    var DEFAULT_GAP_BETWEEN_BARS = 4;
    var LABEL_PADDING = 3;

    var _chart = dc.stackMixin(dc.coordinateGridMixin({}));

    var _gap = DEFAULT_GAP_BETWEEN_BARS;
    var _centerBar = false;
    var _alwaysUseRounding = false;

/* OVERRIDE ---------------------------------------------------------------- */
    var _numBars;
    var _parent = parent;

    _chart.accent = accentBar;
    _chart.unAccent = unAccentBar;
    _chart._numberOfBars = null;
/* ------------------------------------------------------------------------- */

    var _barWidth;

    dc.override(_chart, 'rescale', function () {
        _chart._rescale();
        _barWidth = undefined;

/* TODO: ------------------------------------------------------------------- */
// This was either deleted or did not exist when dc.mapd.js was written.
        return _chart;
/* ------------------------------------------------------------------------- */
    });

/* OVERRIDE ---------------------------------------------------------------- */
    // dc.override(_chart, 'render', function () {
    //     if (_chart.round() && _centerBar && !_alwaysUseRounding) {
    //         dc.logger.warn('By default, brush rounding is disabled if bars are centered. ' +
    //                      'See dc.js bar chart API documentation for details.');
    //     }
    //
    //     return _chart._render();
    // });
/* ------------------------------------------------------------------------- */

    _chart.label(function (d) {
        return dc.utils.printSingleValue(d.y0 + d.y);
    }, false);

    _chart.plotData = function () {
        var layers = _chart.chartBodyG().selectAll('g.stack')
            .data(_chart.data());

        calculateBarWidth();

        layers
            .enter()
            .append('g')
            .attr('class', function (d, i) {
                return 'stack ' + '_' + i;
            });

        var last = layers.size() - 1;
        layers.each(function (d, i) {
            var layer = d3.select(this);

            renderBars(layer, i, d);
            if (_chart.renderLabel() && last === i) {
                renderLabels(layer, i, d);
            }
        });

        if (_chart.brushOn()) {
            hoverOverBrush();
        }
    };

    function hoverOverBrush() {

        var g = _chart.g()
            .on("mouseout", function() {
                dehighlightBars();
            })
            .on("mousemove", function() {
                if (_chart.isBrushing()) {
                    hidePopup();
                } else {
                    highlightBars(g, this);
                }

            });
    }

    function highlightBars(g, e) {

        var coordinates = [0, 0];
        coordinates = _chart.popupCoordinates(d3.mouse(e));
        var x = coordinates[0];
        var y = coordinates[1];
        var xAdjusted = x - _chart.margins().left;
        var yAdjusted = y - _chart.margins().top;

        var popupRows = [];

        var toolTips = g.selectAll('.stack')
            .each(function(){

                var hoverBar = null;

                var bars = d3.select(this).selectAll('.bar')
                    .style('fill-opacity', 1);

                bars[0].sort(function(a, b){
                    return d3.select(a).attr('x') - d3.select(b).attr('x');
                });

                bars[0].some(function(obj, i) {

                    var elm = d3.select(obj);

                    if (xAdjusted < elm.attr('x')) {
                        return true;
                    }

                    hoverBar = { elm: elm, datum: elm.datum(), i: i};
                });

                if (hoverBar && Math.abs(hoverBar.elm.attr('x') - xAdjusted) < _barWidth && yAdjusted > hoverBar.elm.attr('y') - 32) {
                    hoverBar.elm.style('fill-opacity', .8);
                    popupRows.push(hoverBar);
                }

            });

        if (popupRows.length > 0) {
            showPopup(popupRows, x, y);
        } else {
            hidePopup();
        }
    }

    function dehighlightBars(){
        _chart.g().selectAll('.bar').style('fill-opacity', 1);
        hidePopup();
    }

    function showPopup(arr, x, y) {
        
        var dateFormat = d3.time.format.utc("%b %d, %Y");
        var dateTimeFormat = d3.time.format.utc("%b %d, %Y · %I:%M%p");
        var popup = _chart.popup().classed('hide-delay', true);

        var popupBox = popup.select('.chart-popup-box').html('')
            .classed('popup-list', true);

        popupBox.append('div')
            .attr('class', 'popup-header') 
            .text(function(){
                if (arr[0].datum.x instanceof Date) {
                  var diffDays = Math.round(Math.abs((_chart.xAxisMin().getTime() - _chart.xAxisMax().getTime())/(24*60*60*1000)));
                  return _chart.getBinInputVal()[0].val ==='auto' && diffDays > 14 || _chart.getBinInputVal()[0].numSeconds > 3600 ? dateFormat(arr[0].datum.x) : dateTimeFormat(arr[0].datum.x);
                } else {
                  return _chart.xAxisLabel() + ' ' + _chart.formatValue(arr[0].datum.x);
                }
            });


        var popupItems = popupBox.selectAll('.popup-item')
            .data(arr)
            .enter()
            .append('div')
            .attr('class', 'popup-item');

        popupItems.append('div')
            .attr('class', 'popup-legend')
            .style('background-color', function(d) {
                return _chart.getColor(d.datum,d.i);
            });

        popupItems.append('div')
            .attr('class', 'popup-item-value')
            .text(function(d){
                return _chart.formatValue(d.datum.y + d.datum.y0);
            });

        positionPopup(x, y);
        popup.classed('js-showPopup', true);
    }

    function hidePopup() {
        _chart.popup().classed('js-showPopup', false);
    }

    function positionPopup(x, y) {

        var popup =_chart.popup()
            .attr('style', function(){
                return 'transform:translate('+x+'px,'+y+'px)';
            });

        popup.select('.chart-popup-box')
            .classed('align-left-center', true)
            .classed('align-right-center', function(){
                return x + (d3.select(this).node().getBoundingClientRect().width + 32) > _chart.width();
            });
    }

    function barHeight (d) {
        return dc.utils.safeNumber(Math.abs(_chart.y()(d.y + d.y0) - _chart.y()(d.y0)));
    }

    function renderLabels (layer, layerIndex, d) {
        var labels = layer.selectAll('text.barLabel')
            .data(d.values, dc.pluck('x'));

        labels.enter()
            .append('text')
            .attr('class', 'barLabel')
            .attr('text-anchor', 'middle');

        if (_chart.isOrdinal()) {
            labels.on('click', _chart.onClick);
            labels.attr('cursor', 'pointer');
        }

        dc.transition(labels, _chart.transitionDuration())
            .attr('x', function (d) {
                var x = _chart.x()(d.x);
                if (!_centerBar) {
                    x += _barWidth / 2;
                }
                return dc.utils.safeNumber(x);
            })
            .attr('y', function (d) {
                var y = _chart.y()(d.y + d.y0);

                if (d.y < 0) {
                    y -= barHeight(d);
                }

                return dc.utils.safeNumber(y - LABEL_PADDING);
            })
            .text(function (d) {
                return _chart.label()(d);
            });

        dc.transition(labels.exit(), _chart.transitionDuration())
            .attr('height', 0)
            .remove();
    }

    function renderBars (layer, layerIndex, d) {

/* OVERRIDE ---------------------------------------------------------------- */
        _numBars = d.values.length;
/* ------------------------------------------------------------------------- */

        var bars = layer.selectAll('rect.bar')
            .data(d.values, dc.pluck('x'));

        var enter = bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('fill', dc.pluck('data', _chart.getColor))
            .attr('y', _chart.yAxisHeight())
            .attr('height', 0);

        if (_chart.renderTitle()) {
            enter.append('title').text(dc.pluck('data', _chart.title(d.name)));
        }

        if (_chart.isOrdinal()) {
            bars.on('click', _chart.onClick);
        }

        dc.transition(bars, _chart.transitionDuration())
            .attr('x', function (d) {
                var x = _chart.x()(d.x);
                if (_centerBar) {
                    x -= _barWidth / 2;
                }
                if (_chart.isOrdinal() && _gap !== undefined) {
                    x += _gap / 2;
                }
                return dc.utils.safeNumber(x);
            })
            .attr('y', function (d) {
                var y = _chart.y()(d.y + d.y0);

                if (d.y < 0) {
                    y -= barHeight(d);
                }

                return dc.utils.safeNumber(y);
            })
            .attr('width', _barWidth)
            .attr('height', function (d) {
                return barHeight(d);
            })
            .attr('fill', dc.pluck('data', _chart.getColor))
            .select('title').text(dc.pluck('data', _chart.title(d.name)));

        dc.transition(bars.exit(), _chart.transitionDuration())
            .attr('height', 0)
            .remove();
    }

    function calculateBarWidth () {

/* OVERRIDE -----------------------------------------------------------------*/
   //   if (_barWidth === undefined) {
            if (_chart._numberOfBars === null) {
                var numberOfBars = _chart.xUnitCount();
            }
            else {
                var numberOfBars = _chart._numberOfBars;
            }
/* --------------------------------------------------------------------------*/

            // please can't we always use rangeBands for bar charts?
            if (_chart.isOrdinal() && _gap === undefined) {
                _barWidth = Math.floor(_chart.x().rangeBand());
            } else if (_gap) {
                _barWidth = Math.floor((_chart.xAxisLength() - (numberOfBars - 1) * _gap) / numberOfBars);
            } else {
                _barWidth = Math.floor(_chart.xAxisLength() / (1 + _chart.barPadding()) / numberOfBars);
            }

            if (_barWidth === Infinity || isNaN(_barWidth) || _barWidth < MIN_BAR_WIDTH) {
                _barWidth = MIN_BAR_WIDTH;
            }

/* OVERRIDE -----------------------------------------------------------------*/
   //   }
/* --------------------------------------------------------------------------*/
    }

    _chart.fadeDeselectedArea = function () {
        var bars = _chart.chartBodyG().selectAll('rect.bar');
        var extent = _chart.brush().extent();

        if (_chart.isOrdinal()) {
            if (_chart.hasFilter()) {
                bars.classed(dc.constants.SELECTED_CLASS, function (d) {
                    return _chart.hasFilter(d.x);
                });
                bars.classed(dc.constants.DESELECTED_CLASS, function (d) {
                    return !_chart.hasFilter(d.x);
                });
            } else {
                bars.classed(dc.constants.SELECTED_CLASS, false);
                bars.classed(dc.constants.DESELECTED_CLASS, false);
            }
        } else {
            if (!_chart.brushIsEmpty(extent)) {
                var start = extent[0];
                var end = extent[1];

                bars.classed(dc.constants.DESELECTED_CLASS, function (d) {
                    return d.x < start || d.x >= end;
                });
            } else {
                bars.classed(dc.constants.DESELECTED_CLASS, false);
            }
        }
    };

    /**
     * Whether the bar chart will render each bar centered around the data position on the x-axis.
     * @name centerBar
     * @memberof dc.barChart
     * @instance
     * @param {Boolean} [centerBar=false]
     * @return {Boolean}
     * @return {dc.barChart}
     */
    _chart.centerBar = function (centerBar) {
        if (!arguments.length) {
            return _centerBar;
        }
        _centerBar = centerBar;
        return _chart;
    };

/* OVERRIDE EXTEND ----------------------------------------------------------*/
    function accentBar (value) {
      var chartDomain = _chart.x().domain();
      var barNum = Math.floor((value - chartDomain[0]) / (chartDomain[1] - chartDomain[0]) * _numBars);
      _chart.accentSelected($("rect.bar", _parent).get(barNum));
    }

    function unAccentBar (value) {
      var chartDomain = _chart.x().domain();
      var barNum = Math.floor((value - chartDomain[0]) / (chartDomain[1] - chartDomain[0]) * _numBars);

      _chart.unAccentSelected($("rect.bar", _parent).get(barNum));
    };
/* OVERRIDE EXTEND ----------------------------------------------------------*/

    dc.override(_chart, 'onClick', function (d) {
        _chart._onClick(d.data);
    });

    /**
     * Get or set the spacing between bars as a fraction of bar size. Valid values are between 0-1.
     * Setting this value will also remove any previously set {@link #dc.barChart+gap gap}. See the
     * {@link https://github.com/mbostock/d3/wiki/Ordinal-Scales#wiki-ordinal_rangeBands d3 docs}
     * for a visual description of how the padding is applied.
     * @name barPadding
     * @memberof dc.barChart
     * @instance
     * @param {Number} [barPadding=0]
     * @return {Number}
     * @return {dc.barChart}
     */
    _chart.barPadding = function (barPadding) {
        if (!arguments.length) {
            return _chart._rangeBandPadding();
        }
        _chart._rangeBandPadding(barPadding);
        _gap = undefined;
        return _chart;
    };

    _chart._useOuterPadding = function () {
        return _gap === undefined;
    };

    /**
     * Get or set the outer padding on an ordinal bar chart. This setting has no effect on non-ordinal charts.
     * Will pad the width by `padding * barWidth` on each side of the chart.
     * @name outerPadding
     * @memberof dc.barChart
     * @instance
     * @param {Number} [padding=0.5]
     * @return {Number}
     * @return {dc.barChart}
     */
    _chart.outerPadding = _chart._outerRangeBandPadding;

    /**
     * Manually set fixed gap (in px) between bars instead of relying on the default auto-generated
     * gap.  By default the bar chart implementation will calculate and set the gap automatically
     * based on the number of data points and the length of the x axis.
     * @name gap
     * @memberof dc.barChart
     * @instance
     * @param {Number} [gap=2]
     * @return {Number}
     * @return {dc.barChart}
     */
    _chart.gap = function (gap) {
        if (!arguments.length) {
            return _gap;
        }
        _gap = gap;
        return _chart;
    };

    _chart.extendBrush = function () {
        var extent = _chart.brush().extent();
        if (_chart.round() && (!_centerBar || _alwaysUseRounding)) {
            extent[0] = extent.map(_chart.round())[0];
            extent[1] = extent.map(_chart.round())[1];

            _chart.chartBodyG().select('.brush')
                .call(_chart.brush().extent(extent));
        }

        return extent;
    };

    /**
     * Set or get whether rounding is enabled when bars are centered. If false, using
     * rounding with centered bars will result in a warning and rounding will be ignored.  This flag
     * has no effect if bars are not {@link #dc.barChart+centerBar centered}.
     * When using standard d3.js rounding methods, the brush often doesn't align correctly with
     * centered bars since the bars are offset.  The rounding function must add an offset to
     * compensate, such as in the following example.
     * @name alwaysUseRounding
     * @memberof dc.barChart
     * @instance
     * @example
     * chart.round(function(n) { return Math.floor(n) + 0.5; });
     * @param {Boolean} [alwaysUseRounding=false]
     * @return {Boolean}
     * @return {dc.barChart}
     */
    _chart.alwaysUseRounding = function (alwaysUseRounding) {
        if (!arguments.length) {
            return _alwaysUseRounding;
        }
        _alwaysUseRounding = alwaysUseRounding;
        return _chart;
    };

    function colorFilter (color, inv) {
        return function () {
            var item = d3.select(this);
            var match = item.attr('fill') === color;
            return inv ? !match : match;
        };
    }

    _chart.legendHighlight = function (d) {
        if (!_chart.isLegendableHidden(d)) {
            _chart.g().selectAll('rect.bar')
                .classed('highlight', colorFilter(d.color))
                .classed('fadeout', colorFilter(d.color, true));
        }
    };

    _chart.legendReset = function () {
        _chart.g().selectAll('rect.bar')
            .classed('highlight', false)
            .classed('fadeout', false);
    };

    dc.override(_chart, 'xAxisMax', function () {
        var max = this._xAxisMax();
        if ('resolution' in _chart.xUnits()) {
            var res = _chart.xUnits().resolution;
            max += res;
        }
        return max;
    });

    return _chart.anchor(parent, chartGroup);
};
/* ****************************************************************************
 * END OVERRIDE: dc.barChart                                                  *
 * ***************************************************************************/
